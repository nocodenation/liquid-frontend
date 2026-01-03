# NiFi Integration Feasibility Analysis
## Quality Event System - Node.js Frontend

**Analysis Date:** 2026-01-01
**Project:** quality-event-system (Next.js 15.5.7 application)
**Objective:** Assess feasibility of managing this Node.js application via NiFi Controller Service

---

## Executive Summary

**✅ FEASIBLE** - It is technically possible and architecturally sound to manage this Node.js frontend application through a NiFi Controller Service.

**Key Finding:** Java applications (including NiFi) can launch and manage Node.js processes through multiple proven approaches. The recommended approach is a **ProcessManager Controller Service** that uses Java's `ProcessBuilder` API to launch, monitor, and control Node.js child processes.

---

## Project Analysis

### Application Profile

**Technology Stack:**
- **Framework:** Next.js 15.5.7 (React 19.2.0)
- **Runtime:** Node.js (requires v18+, currently v23.7.0 available)
- **Package Manager:** Bun (with fallback to npm/yarn)
- **Build System:** Turbopack (Next.js built-in)
- **UI Components:** Radix UI, shadcn/ui, Tailwind CSS
- **Animations:** Framer Motion
- **Charts:** Recharts

**Application Type:**
- Quality Event Management System (QualityFlow)
- LASER intake, triage, and CAPA workflow system
- ISO 13485 / 21 CFR Part 820 compliant quality management
- Multi-phase workflow application with AI chat sidebar

**Resource Requirements:**
- **Disk Space:** ~656MB total (601MB node_modules, 54MB build output)
- **Memory:** Estimated 256-512MB for development, 128-256MB for production
- **Network:** HTTP server on configurable port (default: 3000)
- **Startup Time:** ~5-15 seconds (depending on mode)

### Runtime Modes

**Development Mode:**
```bash
bun dev  # or: npm run dev
# Runs Next.js dev server with hot-reload on http://localhost:3000
# Startup command from .orchids/orchids.json: "bun install; bun dev"
```

**Production Mode:**
```bash
bun build     # or: npm run build
bun start     # or: npm run start
# Runs optimized production server on http://localhost:3000
```

---

## Feasibility Assessment

### 1. ✅ Technical Feasibility: **CONFIRMED**

#### Approach A: Java ProcessBuilder API (Recommended)

Java provides native process management through `java.lang.ProcessBuilder`:

**Capabilities:**
- ✅ Launch external processes (Node.js, npm, bun)
- ✅ Pass environment variables
- ✅ Capture stdout/stderr streams
- ✅ Monitor process health (isAlive(), exitValue())
- ✅ Graceful shutdown (destroy(), destroyForcibly())
- ✅ Working directory management
- ✅ Redirect input/output streams

**Example Pattern:**
```java
ProcessBuilder pb = new ProcessBuilder("node", "server.js");
pb.directory(new File("/path/to/app"));
pb.environment().put("PORT", "3000");
pb.environment().put("NODE_ENV", "production");
Process process = pb.start();

// Monitor output
BufferedReader reader = new BufferedReader(
    new InputStreamReader(process.getInputStream())
);
// ... stream handling

// Health check
boolean isRunning = process.isAlive();

// Shutdown
process.destroy(); // SIGTERM
// or
process.destroyForcibly(); // SIGKILL
```

#### Approach B: Runtime.exec() (Legacy Alternative)

Older API, still functional but less flexible than ProcessBuilder:

```java
Runtime runtime = Runtime.getRuntime();
Process process = runtime.exec("npm start", envVars, workingDir);
```

**Limitations:**
- Less control over environment
- More complex stream handling
- No direct builder pattern

#### Approach C: Apache Commons Exec (Third-party Library)

Enhanced process management with additional features:

**Benefits:**
- Timeout support
- Watchdog for runaway processes
- Execute handlers for callbacks
- Better stream pumping

**Trade-off:** Adds external dependency to NiFi

---

### 2. ✅ Architectural Fit: **EXCELLENT**

This integration aligns perfectly with NiFi's controller service pattern:

**NiFi Controller Service Model:**
- **Lifecycle Management:** `@OnEnabled`, `@OnDisabled` annotations
- **Configuration:** PropertyDescriptors for all settings
- **State Management:** Service maintains process state
- **Error Handling:** NiFi's built-in error handling framework
- **Monitoring:** NiFi UI displays service status

**Proposed Architecture:**

```
NiFi Controller Service: NodeJSApplicationManagerService
    ├── Configuration Properties
    │   ├── Application Directory Path
    │   ├── Package Manager (npm|yarn|pnpm|bun)
    │   ├── Start Command
    │   ├── Port Number
    │   ├── Node.js Binary Path
    │   ├── Environment Variables (JSON or properties)
    │   ├── Health Check URL
    │   ├── Startup Timeout (seconds)
    │   └── Auto-restart on Failure (boolean)
    │
    ├── Lifecycle Methods
    │   ├── @OnEnabled → startApplication()
    │   ├── @OnDisabled → stopApplication()
    │   └── @OnShutdown → forceStopApplication()
    │
    ├── Process Management
    │   ├── ProcessBuilder instance
    │   ├── Process health monitor thread
    │   ├── Log stream capture (stdout/stderr)
    │   └── Restart logic on crash
    │
    └── API Interface
        ├── isApplicationRunning() → boolean
        ├── getApplicationStatus() → ServiceStatus
        ├── getApplicationLogs(lines) → String
        └── restartApplication() → void
```

---

### 3. ✅ Operational Considerations

#### Startup Sequence

1. **NiFi Service Enable:**
   ```
   User clicks "Enable" on controller service in NiFi UI
   → @OnEnabled method triggered
   ```

2. **Pre-flight Checks:**
   ```java
   - Verify Node.js binary exists
   - Verify application directory exists
   - Verify package.json exists
   - Check if port is available
   ```

3. **Dependency Installation (if needed):**
   ```bash
   cd /path/to/quality-event-system
   bun install  # or npm install
   ```

4. **Application Launch:**
   ```bash
   # Production mode
   bun build && bun start

   # Or development mode (not recommended for production)
   bun dev
   ```

5. **Health Check:**
   ```java
   // Wait up to 30s for app to respond
   for (int i = 0; i < 30; i++) {
       if (isHealthy("http://localhost:3000")) {
           break;
       }
       Thread.sleep(1000);
   }
   ```

6. **Service Enabled:**
   ```
   Controller service shows "Enabled" in NiFi UI
   Application accessible at http://localhost:3000
   ```

#### Shutdown Sequence

1. **NiFi Service Disable:**
   ```
   User clicks "Disable" on controller service
   → @OnDisabled method triggered
   ```

2. **Graceful Shutdown:**
   ```java
   // Send SIGTERM to Node.js process
   process.destroy();

   // Wait up to 10 seconds for graceful shutdown
   boolean exited = process.waitFor(10, TimeUnit.SECONDS);

   if (!exited) {
       // Force kill if still running
       process.destroyForcibly();
   }
   ```

3. **Cleanup:**
   ```java
   - Close log stream readers
   - Stop health check monitor thread
   - Clear process reference
   ```

#### Process Monitoring

**Health Check Strategy:**
```java
// Periodic health check (every 30 seconds)
ScheduledExecutorService healthMonitor = Executors.newScheduledThreadPool(1);
healthMonitor.scheduleAtFixedRate(() -> {
    if (!process.isAlive()) {
        logger.error("Application crashed, restarting...");
        if (autoRestart) {
            restartApplication();
        }
    } else {
        // HTTP health check
        boolean healthy = checkHealth(healthCheckUrl);
        if (!healthy) {
            logger.warn("Application not responding to health check");
        }
    }
}, 30, 30, TimeUnit.SECONDS);
```

**Log Capture:**
```java
// Capture stdout/stderr to NiFi bulletin/log
BufferedReader stdoutReader = new BufferedReader(
    new InputStreamReader(process.getInputStream())
);
BufferedReader stderrReader = new BufferedReader(
    new InputStreamReader(process.getErrorStream())
);

// Stream to NiFi logger
new Thread(() -> {
    String line;
    while ((line = stdoutReader.readLine()) != null) {
        logger.info("[Node.js] " + line);
    }
}).start();
```

---

### 4. ✅ Configuration Management

#### Controller Service Properties

```java
public static final PropertyDescriptor APP_DIRECTORY = new PropertyDescriptor.Builder()
    .name("Application Directory")
    .description("Absolute path to the Node.js application directory")
    .required(true)
    .addValidator(StandardValidators.createDirectoryExistsValidator(true, false))
    .expressionLanguageSupported(ExpressionLanguageScope.ENVIRONMENT)
    .build();

public static final PropertyDescriptor NODE_BINARY = new PropertyDescriptor.Builder()
    .name("Node.js Binary Path")
    .description("Path to Node.js executable (default: node)")
    .required(false)
    .defaultValue("node")
    .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
    .build();

public static final PropertyDescriptor PACKAGE_MANAGER = new PropertyDescriptor.Builder()
    .name("Package Manager")
    .description("Package manager to use for running scripts")
    .required(true)
    .allowableValues("npm", "yarn", "pnpm", "bun")
    .defaultValue("npm")
    .build();

public static final PropertyDescriptor START_COMMAND = new PropertyDescriptor.Builder()
    .name("Start Command")
    .description("Command to start the application (e.g., 'start' for production, 'dev' for development)")
    .required(true)
    .defaultValue("start")
    .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
    .build();

public static final PropertyDescriptor PORT = new PropertyDescriptor.Builder()
    .name("Port Number")
    .description("Port number for the application to listen on")
    .required(true)
    .defaultValue("3000")
    .addValidator(StandardValidators.PORT_VALIDATOR)
    .build();

public static final PropertyDescriptor ENV_VARS = new PropertyDescriptor.Builder()
    .name("Environment Variables")
    .description("JSON object of environment variables to pass to the application")
    .required(false)
    .defaultValue("{\"NODE_ENV\":\"production\"}")
    .addValidator(StandardValidators.NON_EMPTY_VALIDATOR)
    .build();

public static final PropertyDescriptor HEALTH_CHECK_URL = new PropertyDescriptor.Builder()
    .name("Health Check URL")
    .description("URL to check for application health (default: http://localhost:{port})")
    .required(false)
    .addValidator(StandardValidators.URL_VALIDATOR)
    .build();

public static final PropertyDescriptor STARTUP_TIMEOUT = new PropertyDescriptor.Builder()
    .name("Startup Timeout")
    .description("Maximum seconds to wait for application to start")
    .required(true)
    .defaultValue("30")
    .addValidator(StandardValidators.POSITIVE_INTEGER_VALIDATOR)
    .build();

public static final PropertyDescriptor AUTO_RESTART = new PropertyDescriptor.Builder()
    .name("Auto-restart on Failure")
    .description("Automatically restart application if process crashes")
    .required(true)
    .allowableValues("true", "false")
    .defaultValue("true")
    .build();

public static final PropertyDescriptor BUILD_ON_START = new PropertyDescriptor.Builder()
    .name("Build on Start")
    .description("Run 'build' command before starting (production mode)")
    .required(true)
    .allowableValues("true", "false")
    .defaultValue("true")
    .build();
```

#### Example Configuration for Quality Event System

```
Application Directory: /opt/nifi/apps/quality-event-system
Package Manager: bun
Start Command: start
Port Number: 3000
Environment Variables: {"NODE_ENV":"production","PORT":"3000"}
Health Check URL: http://localhost:3000
Startup Timeout: 30
Auto-restart on Failure: true
Build on Start: true
```

---

### 5. ✅ Integration Patterns

#### Pattern 1: Standalone Service

**Use Case:** Frontend application runs independently, NiFi just manages lifecycle

```
┌─────────────────────────┐
│   NiFi Environment      │
│                         │
│  ┌──────────────────┐   │
│  │ Controller       │   │
│  │ Service:         │   │
│  │ QualityEventApp  │   │
│  └────────┬─────────┘   │
│           │             │
│           ├─ Enable  → Start Node.js process
│           ├─ Disable → Stop Node.js process
│           └─ Monitor → Health checks
│                         │
└─────────────────────────┘
           │
           ↓
     Node.js Process
  (quality-event-system)
  http://localhost:3000
```

**Benefit:** Clean separation, frontend remains independent

#### Pattern 2: Integrated with Processors

**Use Case:** NiFi processors interact with frontend (e.g., push events, fetch data)

```
┌─────────────────────────────────────────┐
│          NiFi Flow                      │
│                                         │
│  ┌───────────┐      ┌──────────────┐   │
│  │  Data     │      │ InvokeHTTP   │   │
│  │  Source   │─────▶│ POST Event   │   │
│  └───────────┘      └──────┬───────┘   │
│                            │           │
│  ┌─────────────────────────▼────────┐  │
│  │ Controller Service:              │  │
│  │ QualityEventApp                  │  │
│  │ (manages Node.js process)        │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  │
                  ↓
           Node.js App
      http://localhost:3000
      /api/events endpoint
```

**Benefit:** NiFi can programmatically interact with frontend API

#### Pattern 3: Embedded UI in NiFi

**Use Case:** Frontend accessible through NiFi's web interface via reverse proxy

```
User Browser
    ↓
http://localhost:8443/nifi/quality-events
    ↓
NiFi Web Server (Jetty)
    ↓
Reverse Proxy Configuration
    ↓
http://localhost:3000 (Node.js App)
```

**Implementation:** Custom NiFi UI extension with embedded iframe or reverse proxy

---

## Recommended Implementation Plan

### Phase 1: Core Controller Service (Milestone 1)

**Deliverable:** Basic NodeJSApplicationManagerService

**Features:**
- ✅ Start/stop Node.js process via ProcessBuilder
- ✅ Configure via PropertyDescriptors (app path, port, command)
- ✅ Basic health checking (process.isAlive())
- ✅ Log capture (stdout/stderr → NiFi logs)
- ✅ Enable/disable lifecycle

**Estimated Complexity:** Medium (2-3 days development)

**File Structure:**
```
liquid-library/src/java_extensions/nodejs-app-manager/
├── pom.xml (parent)
├── nodejs-app-manager-service-api/
│   ├── pom.xml
│   └── src/main/java/org/nocodenation/nifi/nodejsapp/
│       └── NodeJSApplicationManagerService.java (interface)
├── nodejs-app-manager-service-api-nar/
│   └── pom.xml
├── nodejs-app-manager-service/
│   ├── pom.xml
│   └── src/main/java/org/nocodenation/nifi/nodejsapp/
│       ├── StandardNodeJSApplicationManagerService.java
│       └── ProcessMonitor.java
└── nodejs-app-manager-service-nar/
    └── pom.xml
```

### Phase 2: Advanced Features (Milestone 2)

**Features:**
- ✅ HTTP health check endpoint monitoring
- ✅ Auto-restart on crash
- ✅ Environment variable injection (JSON config)
- ✅ Build command execution (npm build, bun build)
- ✅ Multiple package manager support (npm, yarn, pnpm, bun)
- ✅ Configurable startup timeout

**Estimated Complexity:** Medium (2-3 days development)

### Phase 3: Production Hardening (Milestone 3)

**Features:**
- ✅ Graceful shutdown with timeout
- ✅ Log rotation and size limits
- ✅ Performance metrics (CPU, memory usage via JMX)
- ✅ Status API for processors to query
- ✅ Dependency installation on first start
- ✅ Application output buffering/bulletin integration

**Estimated Complexity:** Medium-High (3-4 days development)

### Phase 4: Multi-Application Support (Optional)

**Features:**
- ✅ Manage multiple Node.js apps simultaneously
- ✅ Dynamic app registration/deregistration
- ✅ Load balancing across instances
- ✅ Port management and assignment

**Estimated Complexity:** High (5-7 days development)

---

## Challenges & Mitigations

### Challenge 1: Process Lifecycle Synchronization

**Issue:** Node.js process may not shut down cleanly when NiFi service is disabled

**Mitigation:**
```java
// Implement graceful shutdown with timeout
process.destroy(); // SIGTERM
boolean exited = process.waitFor(10, TimeUnit.SECONDS);
if (!exited) {
    process.destroyForcibly(); // SIGKILL
    logger.warn("Application did not stop gracefully, forced termination");
}
```

### Challenge 2: Port Conflicts

**Issue:** Port 3000 may already be in use

**Mitigation:**
- Make port configurable via PropertyDescriptor
- Check port availability before starting
- Support dynamic port assignment
- Use environment variable PORT for Node.js app

### Challenge 3: Dependency Installation

**Issue:** node_modules may not exist on first start

**Mitigation:**
```java
// Check for node_modules directory
File nodeModules = new File(appDirectory, "node_modules");
if (!nodeModules.exists()) {
    logger.info("Installing dependencies...");
    ProcessBuilder install = new ProcessBuilder(packageManager, "install");
    install.directory(appDirectory);
    Process installProcess = install.start();
    int exitCode = installProcess.waitFor();
    if (exitCode != 0) {
        throw new Exception("Dependency installation failed");
    }
}
```

### Challenge 4: Log Overflow

**Issue:** Node.js applications can produce large amounts of log output

**Mitigation:**
- Implement circular buffer for log storage
- Write logs to separate file with rotation
- Only send errors/warnings to NiFi bulletins
- Configurable log level filtering

### Challenge 5: Node.js Version Compatibility

**Issue:** Application requires specific Node.js version

**Mitigation:**
- Allow configurable Node.js binary path
- Check Node.js version on startup
- Document version requirements
- Support nvm (Node Version Manager) integration

---

## Performance Considerations

### Memory Footprint

**NiFi Controller Service:** ~10-20MB (Java objects, thread pools)
**Node.js Application:** ~128-512MB (varies by mode and traffic)
**Total Additional:** ~138-532MB per application instance

**Acceptable for:** Most NiFi deployments with 4GB+ heap

### CPU Usage

**Startup:** 50-100% of 1 core for 5-15 seconds (build + start)
**Runtime:** 5-20% of 1 core (idle to moderate traffic)
**NiFi Overhead:** <1% (health check polling)

**Impact:** Minimal on NiFi performance

### Network

**Port Usage:** 1 port per application instance (default: 3000)
**Bandwidth:** Depends on frontend traffic (typically <10Mbps)
**Latency:** HTTP requests via localhost (<1ms)

**Impact:** Negligible

---

## Security Considerations

### 1. Process Isolation

**Risk:** Node.js process runs with NiFi's user permissions

**Mitigation:**
- Use least-privilege user for NiFi
- Consider running Node.js as separate user (requires sudo setup)
- Restrict file system access via Java SecurityManager

### 2. Network Exposure

**Risk:** Frontend exposed on localhost:3000 without authentication

**Mitigation:**
- Bind to 127.0.0.1 only (not 0.0.0.0)
- Use NiFi's authentication proxy
- Implement reverse proxy with SSL/TLS
- Add authentication layer to Node.js app

### 3. Environment Variables

**Risk:** Sensitive credentials in environment variables

**Mitigation:**
- Encrypt sensitive values in NiFi properties
- Use NiFi's sensitive property support
- Avoid logging environment variables
- Rotate credentials regularly

### 4. Command Injection

**Risk:** Malicious input in PropertyDescriptors could execute arbitrary commands

**Mitigation:**
```java
// Whitelist allowed package managers
private static final Set<String> ALLOWED_PACKAGE_MANAGERS =
    Set.of("npm", "yarn", "pnpm", "bun");

// Validate all inputs
if (!ALLOWED_PACKAGE_MANAGERS.contains(packageManager)) {
    throw new IllegalArgumentException("Invalid package manager");
}

// Use ProcessBuilder with separate arguments (not shell execution)
new ProcessBuilder(packageManager, "start");  // Safe
// NOT: Runtime.exec("npm start"); // Unsafe
```

---

## Alternative Approaches (Considered but Not Recommended)

### Alternative 1: Docker Container Management

**Approach:** NiFi controller service manages Docker container running Node.js app

**Pros:**
- Better isolation
- Easier version management
- Standard container practices

**Cons:**
- Requires Docker installed
- More complex setup
- Additional resource overhead
- Nested containerization if NiFi also in container

**Verdict:** ❌ Over-engineered for this use case

### Alternative 2: Embedded JavaScript Engine (GraalVM)

**Approach:** Run Node.js code directly in JVM via GraalVM

**Pros:**
- No separate process
- Tight integration

**Cons:**
- Limited Node.js compatibility
- Complex build setup
- Not all npm packages work
- Significant performance overhead

**Verdict:** ❌ Not production-ready for full Next.js apps

### Alternative 3: External Process Manager (PM2, systemd)

**Approach:** NiFi just triggers external process manager via API/scripts

**Pros:**
- Leverage existing tools
- Proven reliability

**Cons:**
- Loose coupling
- No NiFi UI integration
- Multiple management layers
- Harder to monitor

**Verdict:** ❌ Defeats purpose of NiFi integration

---

## Conclusion

### Feasibility Verdict: ✅ **HIGHLY FEASIBLE**

**Confidence Level:** 95%

### Key Strengths

1. ✅ **Proven Java Process Management:** ProcessBuilder is mature and reliable
2. ✅ **Architectural Fit:** NiFi controller services are perfect for this pattern
3. ✅ **Low Complexity:** Implementation is straightforward without exotic dependencies
4. ✅ **Operational Benefits:** Centralized management, monitoring, and lifecycle control
5. ✅ **Minimal Performance Impact:** Node.js process overhead is acceptable

### Recommended Path Forward

**Next Steps:**

1. **Specification Phase (Current)**
   - Review and approve this feasibility analysis
   - Define detailed requirements
   - Prioritize features for MVP

2. **Prototype Phase (1 week)**
   - Implement basic NodeJSApplicationManagerService (Pattern B structure)
   - Test with quality-event-system application
   - Validate start/stop/restart functionality

3. **Development Phase (2-3 weeks)**
   - Implement Phase 1-2 features
   - Add comprehensive error handling
   - Write unit and integration tests

4. **Testing Phase (1 week)**
   - Test with liquid-playground environment
   - Stress test with multiple restarts
   - Validate crash recovery

5. **Documentation & Deployment (3-5 days)**
   - Write user guide and API documentation
   - Create flow definition examples
   - Deploy to production environment

**Total Estimated Timeline:** 4-6 weeks to production-ready implementation

### Success Criteria

- ✅ Service can start/stop quality-event-system reliably
- ✅ Application remains accessible at http://localhost:3000
- ✅ Automatic recovery from crashes
- ✅ Clean integration with NiFi UI
- ✅ Comprehensive logging and monitoring
- ✅ Resource usage within acceptable limits (<500MB memory, <20% CPU)

---

## Technical Specifications for Next Phase

When ready to proceed to implementation, the specification should include:

1. **API Contract:** Interface definition for NodeJSApplicationManagerService
2. **Configuration Schema:** Complete PropertyDescriptor definitions
3. **State Machine:** Service lifecycle state transitions
4. **Error Handling:** Exception taxonomy and handling strategies
5. **Monitoring Interface:** Metrics and health check specifications
6. **Testing Plan:** Unit test coverage and integration test scenarios
7. **Deployment Guide:** Installation and configuration instructions

---

**Document Status:** Ready for Review and Approval
**Next Action:** Stakeholder review and decision on implementation
**Contact:** Development Team Lead for questions or clarifications

---

*This feasibility analysis confirms that integrating the quality-event-system Node.js application with NiFi via a custom controller service is not only possible but represents a clean, maintainable solution that leverages both platforms' strengths.*