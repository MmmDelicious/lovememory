"use strict";
// LoveMemory Intelligence Core Types
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIServiceError = exports.AnalysisError = exports.ContextBuildError = exports.IntelligenceError = void 0;
// Error Types
class IntelligenceError extends Error {
    constructor(message, code, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'IntelligenceError';
    }
}
exports.IntelligenceError = IntelligenceError;
class ContextBuildError extends IntelligenceError {
    constructor(message, details) {
        super(message, 'CONTEXT_BUILD_ERROR', 500, details);
    }
}
exports.ContextBuildError = ContextBuildError;
class AnalysisError extends IntelligenceError {
    constructor(message, details) {
        super(message, 'ANALYSIS_ERROR', 500, details);
    }
}
exports.AnalysisError = AnalysisError;
class AIServiceError extends IntelligenceError {
    constructor(message, details) {
        super(message, 'AI_SERVICE_ERROR', 502, details);
    }
}
exports.AIServiceError = AIServiceError;
//# sourceMappingURL=intelligence.types.js.map