export const CNB_SECUENCE_PORT = 'CNB_SECUENCE_PORT' as const;

export interface CnbSecuencePort {
  getSecuence(): Promise<string>;
}
