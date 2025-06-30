import { Test, TestingModule } from '@nestjs/testing';
import { CreateCalificationService } from './create-calification.service';
import { MSA_CO_CALIFICATION_SERVICE } from '../../../external-services/msa-co-calification/interfaces/msa-co-calification-service.interface';
import { CreateCalificationInput } from '../dto/create-calification.dto';
import { ErrorCodes } from '../../../common/constants/error-codes';
import { of, throwError } from 'rxjs';
import { Logger } from '@nestjs/common';
import { ApolloError } from 'apollo-server-core';

describe('CreateCalificationService', () => {
  let service: CreateCalificationService;
  let mockCalificationService: jest.Mocked<any>;
  let loggerSpy: jest.SpyInstance;

  const mockUsername = 'test-user-123';
  const mockValidInput: CreateCalificationInput = {
    rating: 2,
    comments: 'Excelente servicio',
    context: 'CNB',
  };

  beforeEach(async () => {
    mockCalificationService = {
      sendCalification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCalificationService,
        {
          provide: MSA_CO_CALIFICATION_SERVICE,
          useValue: mockCalificationService,
        },
      ],
    }).compile();

    service = module.get<CreateCalificationService>(CreateCalificationService);
    loggerSpy = jest.spyOn(Logger.prototype, 'error');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCalification', () => {
    describe('casos exitosos', () => {
      it('debe crear una calificación exitosamente', async () => {
        mockCalificationService.sendCalification.mockReturnValue(
          of({ status: 'success', message: 'Calificación creada' }),
        );

        const result = await service.createCalification(
          mockValidInput,
          mockUsername,
        );

        expect(result).toEqual({ status: 'success' });
        expect(mockCalificationService.sendCalification).toHaveBeenCalledWith({
          userId: mockUsername,
          rating: mockValidInput.rating,
          context: mockValidInput.context,
          comments: mockValidInput.comments,
        });
      });
    });

    describe('validación de entrada', () => {
      it('debe validar username vacío', async () => {
        try {
          await service.createCalification(mockValidInput, '');
          fail('Debería haber lanzado un error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApolloError);
          expect(error.extensions.errorResponse).toEqual({
            status: 'ERROR',
            errors: [
              {
                code: ErrorCodes.CALIFICATION_INVALID_USER,
                message: 'User ID is required and cannot be empty',
                context: 'create-calification',
              },
            ],
          });
        }
      });

      it('debe validar rating fuera de rango (menor)', async () => {
        const invalidInput = { ...mockValidInput, rating: 1 };
        try {
          await service.createCalification(invalidInput, mockUsername);
          fail('Debería haber lanzado un error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApolloError);
          expect(error.extensions.errorResponse).toEqual({
            status: 'ERROR',
            errors: [
              {
                code: ErrorCodes.CALIFICATION_INVALID_RATING,
                message:
                  'Rating is required and cannot be empty, valid values are 0, 2 or 4',
                context: 'create-calification',
              },
            ],
          });
        }
      });

      it('debe validar rating fuera de rango (mayor)', async () => {
        const invalidInput = { ...mockValidInput, rating: 3 };
        try {
          await service.createCalification(invalidInput, mockUsername);
          fail('Debería haber lanzado un error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApolloError);
          expect(error.extensions.errorResponse).toEqual({
            status: 'ERROR',
            errors: [
              {
                code: ErrorCodes.CALIFICATION_INVALID_RATING,
                message:
                  'Rating is required and cannot be empty, valid values are 0, 2 or 4',
                context: 'create-calification',
              },
            ],
          });
        }
      });

      it('debe validar context vacío', async () => {
        const invalidInput = { ...mockValidInput, context: '' };
        try {
          await service.createCalification(invalidInput, mockUsername);
          fail('Debería haber lanzado un error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApolloError);
          expect(error.extensions.errorResponse).toEqual({
            status: 'ERROR',
            errors: [
              {
                code: ErrorCodes.CALIFICATION_INVALID_CONTEXT,
                message: 'Context is required and cannot be empty',
                context: 'create-calification',
              },
            ],
          });
        }
      });
    });

    describe('manejo de errores', () => {
      it('debe manejar respuesta vacía del servicio', async () => {
        mockCalificationService.sendCalification.mockReturnValue(of(null));

        try {
          await service.createCalification(mockValidInput, mockUsername);
          fail('Debería haber lanzado un error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApolloError);
          expect(error.extensions.errorResponse).toEqual({
            status: 'ERROR',
            errors: [
              {
                code: ErrorCodes.CALIFICATION_PROCESS_FAILED,
                message: 'Failed to process calification: No response received',
                context: 'create-calification',
              },
            ],
          });
          expect(loggerSpy).toHaveBeenCalledWith(
            'No response received from calification service',
          );
        }
      });

      it('debe manejar error del servicio', async () => {
        mockCalificationService.sendCalification.mockReturnValue(
          of({ status: 'error', message: 'Error del servicio' }),
        );

        try {
          await service.createCalification(mockValidInput, mockUsername);
          fail('Debería haber lanzado un error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApolloError);
          expect(error.extensions.errorResponse).toEqual({
            status: 'ERROR',
            errors: [
              {
                code: ErrorCodes.CALIFICATION_SERVICE_ERROR,
                message: 'Error del servicio',
                context: 'create-calification',
              },
            ],
          });
          expect(loggerSpy).toHaveBeenCalledWith(
            'Calification service error: Error del servicio',
          );
        }
      });

      it('debe manejar excepción del servicio', async () => {
        const mockError = new Error('Error de red');
        mockCalificationService.sendCalification.mockReturnValue(
          throwError(() => mockError),
        );

        try {
          await service.createCalification(mockValidInput, mockUsername);
          fail('Debería haber lanzado un error');
        } catch (error) {
          expect(error).toBeInstanceOf(ApolloError);
          expect(error.extensions.errorResponse).toEqual({
            status: 'ERROR',
            errors: [
              {
                code: ErrorCodes.SYS_ERROR_UNKNOWN,
                message: 'Error de red',
                context: 'create-calification',
              },
            ],
          });
          expect(loggerSpy).toHaveBeenCalledWith(
            'Error in createCalification: Error de red',
            mockError.stack,
          );
        }
      });
    });
  });

  describe('validateCalificationInput', () => {
    let service: CreateCalificationService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CreateCalificationService,
          {
            provide: MSA_CO_CALIFICATION_SERVICE,
            useValue: {
              sendCalification: jest.fn(),
            },
          },
        ],
      }).compile();

      service = module.get<CreateCalificationService>(
        CreateCalificationService,
      );
    });

    describe('validación de username', () => {
      it('debe lanzar error cuando username es undefined', () => {
        expect(() => {
          service['validateCalificationInput'](undefined, 2, 'test-context');
        }).toThrow('User ID is required and cannot be empty');
      });

      it('debe lanzar error cuando username está vacío', () => {
        expect(() => {
          service['validateCalificationInput']('', 2, 'test-context');
        }).toThrow('User ID is required and cannot be empty');
      });

      it('debe lanzar error cuando username solo contiene espacios', () => {
        expect(() => {
          service['validateCalificationInput']('   ', 2, 'test-context');
        }).toThrow('User ID is required and cannot be empty');
      });
    });

    describe('validación de rating', () => {
      it('debe lanzar error cuando rating es undefined', () => {
        expect(() => {
          service['validateCalificationInput'](
            'test-user',
            undefined,
            'test-context',
          );
        }).toThrow(
          'Rating is required and cannot be empty, valid values are 0, 2 or 4',
        );
      });

      it('debe lanzar error cuando rating no es un valor permitido', () => {
        const invalidRatings = [-1, 1, 3, 5];

        invalidRatings.forEach((rating) => {
          expect(() => {
            service['validateCalificationInput'](
              'test-user',
              rating,
              'test-context',
            );
          }).toThrow(
            'Rating is required and cannot be empty, valid values are 0, 2 or 4',
          );
        });
      });

      it('debe aceptar valores de rating válidos', () => {
        const validRatings = [0, 2, 4];

        validRatings.forEach((rating) => {
          expect(() => {
            service['validateCalificationInput'](
              'test-user',
              rating,
              'test-context',
            );
          }).not.toThrow();
        });
      });
    });

    describe('validación de context', () => {
      it('debe lanzar error cuando context es undefined', () => {
        expect(() => {
          service['validateCalificationInput']('test-user', 2, undefined);
        }).toThrow('Context is required and cannot be empty');
      });

      it('debe lanzar error cuando context está vacío', () => {
        expect(() => {
          service['validateCalificationInput']('test-user', 2, '');
        }).toThrow('Context is required and cannot be empty');
      });

      it('debe lanzar error cuando context solo contiene espacios', () => {
        expect(() => {
          service['validateCalificationInput']('test-user', 2, '   ');
        }).toThrow('Context is required and cannot be empty');
      });
    });

    it('debe aceptar una entrada válida sin lanzar errores', () => {
      expect(() => {
        service['validateCalificationInput']('test-user', 2, 'test-context');
      }).not.toThrow();
    });
  });
});
