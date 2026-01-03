/**
 * NiFi Gateway Client
 *
 * Client for submitting quality events to the NiFi Gateway endpoint.
 * Handles communication with the NodeJSAppAPIGateway service.
 */

/**
 * Workflow stages for progressive submission
 */
export type WorkflowStage = 'laser' | 'triage' | 'resolution' | 'completed';

/**
 * Quality event payload structure matching the LASER + Triage + Resolution workflow
 * Fields are optional to support progressive submission
 */
export interface QualityEventPayload {
  eventId: string;
  timestamp: string;
  currentStage: WorkflowStage;
  completed?: boolean;

  // LASER Framework data (optional for progressive submission)
  laser?: {
    locate?: {
      what: string;
      where: string;
      when: string;
      who: string;
      files?: string[]; // File names/paths
    };
    anchor?: {
      documentType: string;
      documentId: string;
      section: string;
    };
    stateGap?: {
      expected: string;
      actual: string;
    };
    explainImpact?: {
      impactType: string;
      isRecurring: boolean;
    };
    revealMechanism?: {
      description: string;
    };
    problemStatement?: string;
  };

  // Triage Assessment data (optional for progressive submission)
  triage?: {
    isNC: boolean;
    severity: string;
    occurrence: string;
    riskLevel: string;
    path: string;
    rationale: string;
  };

  // Resolution Workspace data (optional for progressive submission)
  resolution?: {
    path: string;
    phases: Array<{
      id: string;
      label: string;
      completed: boolean;
      data?: any;
    }>;
    rootCauseAnalysis?: any;
    actions?: any[];
    verification?: any;
  };
}

/**
 * Response from NiFi Gateway
 */
export interface NiFiGatewayResponse {
  success: boolean;
  eventId: string;
  message?: string;
}

/**
 * Configuration for NiFi client
 */
export interface NiFiClientConfig {
  gatewayUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<NiFiClientConfig> = {
  gatewayUrl: process.env.NEXT_PUBLIC_NIFI_GATEWAY_URL || 'http://localhost:5050',
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 10000,
};

/**
 * NiFi Gateway Client
 */
export class NiFiClient {
  private config: Required<NiFiClientConfig>;

  constructor(config: NiFiClientConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate a unique event ID
   */
  generateEventId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `evt_${timestamp}_${random}`;
  }

  /**
   * Submit a complete quality event to NiFi Gateway
   */
  async submitQualityEvent(
    payload: QualityEventPayload
  ): Promise<NiFiGatewayResponse> {
    const url = `${this.config.gatewayUrl}/api/quality-event/${payload.eventId}`;

    return this._sendWithRetry(url, payload, 1);
  }

  /**
   * Internal method to send request with retry logic
   */
  private async _sendWithRetry(
    url: string,
    payload: QualityEventPayload,
    attempt: number
  ): Promise<NiFiGatewayResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Event-Id': payload.eventId,
          'X-Timestamp': payload.timestamp,
          'X-Stage': payload.currentStage,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 202) {
        // Success - request accepted
        return {
          success: true,
          eventId: payload.eventId,
          message: 'Quality event accepted by NiFi',
        };
      } else if (response.status === 503 && attempt < this.config.maxRetries) {
        // Queue full - retry after delay
        console.warn(
          `NiFi queue full (attempt ${attempt}/${this.config.maxRetries}), retrying in ${this.config.retryDelay}ms...`
        );
        await this._sleep(this.config.retryDelay);
        return this._sendWithRetry(url, payload, attempt + 1);
      } else {
        // Other error
        const errorText = await response.text();
        throw new Error(
          `Gateway returned ${response.status}: ${errorText || response.statusText}`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(
            `Request timeout after ${this.config.timeout}ms. NiFi Gateway may be unavailable.`
          );
        }
        if (error.message.includes('fetch')) {
          throw new Error(
            `Cannot connect to NiFi Gateway at ${this.config.gatewayUrl}. Is the gateway running?`
          );
        }
      }
      throw error;
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Health check - verify NiFi Gateway is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.config.gatewayUrl}/_metrics`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Submit LASER stage data (progressive submission)
   */
  async submitLaserStage(
    eventId: string,
    laserData: any,
    problemStatement: string
  ): Promise<NiFiGatewayResponse> {
    const payload: QualityEventPayload = {
      eventId,
      timestamp: new Date().toISOString(),
      currentStage: 'laser',
      laser: {
        locate: laserData.locate,
        anchor: laserData.anchor,
        stateGap: laserData.stateGap,
        explainImpact: laserData.explainImpact,
        revealMechanism: laserData.revealMechanism,
        problemStatement,
      },
    };
    return this.submitQualityEvent(payload);
  }

  /**
   * Submit Triage stage data (progressive submission)
   */
  async submitTriageStage(
    eventId: string,
    triageResult: any
  ): Promise<NiFiGatewayResponse> {
    const payload: QualityEventPayload = {
      eventId,
      timestamp: new Date().toISOString(),
      currentStage: 'triage',
      triage: {
        isNC: triageResult.isNC,
        severity: triageResult.severity,
        occurrence: triageResult.occurrence,
        riskLevel: triageResult.riskLevel,
        path: triageResult.path,
        rationale: triageResult.rationale,
      },
    };
    return this.submitQualityEvent(payload);
  }

  /**
   * Submit Resolution stage data (progressive submission)
   */
  async submitResolutionStage(
    eventId: string,
    resolutionData: any,
    completed: boolean = false
  ): Promise<NiFiGatewayResponse> {
    const payload: QualityEventPayload = {
      eventId,
      timestamp: new Date().toISOString(),
      currentStage: completed ? 'completed' : 'resolution',
      completed,
      resolution: resolutionData,
    };
    return this.submitQualityEvent(payload);
  }
}

/**
 * Singleton instance for use across the application
 */
export const nifiClient = new NiFiClient();

/**
 * Helper function to aggregate workflow data into NiFi payload (for complete submission)
 * @deprecated Use stage-specific methods (submitLaserStage, submitTriageStage, submitResolutionStage) instead
 */
export function createQualityEventPayload(
  eventId: string,
  laserData: any,
  problemStatement: string,
  triageResult: any,
  resolutionData: any
): QualityEventPayload {
  return {
    eventId,
    timestamp: new Date().toISOString(),
    currentStage: 'completed',
    completed: true,
    laser: {
      locate: {
        what: laserData.locate?.what || '',
        where: laserData.locate?.where || '',
        when: laserData.locate?.when || '',
        who: laserData.locate?.who || '',
        files: laserData.locate?.files?.map((f: File) => f.name) || [],
      },
      anchor: {
        documentType: laserData.anchor?.documentType || '',
        documentId: laserData.anchor?.documentId || '',
        section: laserData.anchor?.section || '',
      },
      stateGap: {
        expected: laserData.stateGap?.expected || '',
        actual: laserData.stateGap?.actual || '',
      },
      explainImpact: {
        impactType: laserData.explainImpact?.impactType || '',
        isRecurring: laserData.explainImpact?.isRecurring || false,
      },
      revealMechanism: {
        description: laserData.revealMechanism?.description || '',
      },
      problemStatement,
    },
    triage: {
      isNC: triageResult?.isNC || false,
      severity: triageResult?.severity || '',
      occurrence: triageResult?.occurrence || '',
      riskLevel: triageResult?.riskLevel || '',
      path: triageResult?.path || '',
      rationale: triageResult?.rationale || '',
    },
    resolution: resolutionData || {
      path: '',
      phases: [],
    },
  };
}
