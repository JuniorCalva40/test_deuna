import { maskEmail } from './email_masker.util';

describe('maskEmail', () => {
  describe('cuando se procesa un email válido', () => {
    it('debe enmascarar correctamente un email con username y dominio largos', () => {
      const email = 'jonathan.doe@empresa.com';
      const resultado = maskEmail(email);
      expect(resultado).toBe('j**********e@e*****a.com');
    });

    it('debe enmascarar correctamente un email con username corto', () => {
      const email = 'joe@empresa.com';
      const resultado = maskEmail(email);
      expect(resultado).toBe('***@e*****a.com');
    });

    it('debe enmascarar correctamente un email con dominio corto', () => {
      const email = 'jonathan@abc.com';
      const resultado = maskEmail(email);
      expect(resultado).toBe('j******n@***.com');
    });

    it('debe manejar correctamente emails con múltiples puntos en el dominio', () => {
      const email = 'user@sub.domain.co.uk';
      const resultado = maskEmail(email);
      expect(resultado).toBe('u**r@***.domain.co.uk');
    });
  });

  describe('cuando se manejan casos especiales', () => {
    it('debe retornar string vacío si el email es undefined', () => {
      const resultado = maskEmail(undefined as unknown as string);
      expect(resultado).toBe('');
    });

    it('debe retornar string vacío si el email es null', () => {
      const resultado = maskEmail(null as unknown as string);
      expect(resultado).toBe('');
    });

    it('debe retornar string vacío si el email es vacío', () => {
      const resultado = maskEmail('');
      expect(resultado).toBe('');
    });

    it('debe manejar correctamente un email sin dominio', () => {
      const resultado = maskEmail('useronly');
      expect(resultado).toBe('u******y');
    });
  });

  describe('casos límite de enmascaramiento', () => {
    it('debe enmascarar correctamente un email con username de 3 caracteres', () => {
      const email = 'abc@domain.com';
      const resultado = maskEmail(email);
      expect(resultado).toBe('***@d****n.com');
    });

    it('debe enmascarar correctamente un email con username de 2 caracteres', () => {
      const email = 'ab@domain.com';
      const resultado = maskEmail(email);
      expect(resultado).toBe('**@d****n.com');
    });

    it('debe enmascarar correctamente un email con dominio de 2 caracteres antes del punto', () => {
      const email = 'user@ab.com';
      const resultado = maskEmail(email);
      expect(resultado).toBe('u**r@**.com');
    });
  });
});
