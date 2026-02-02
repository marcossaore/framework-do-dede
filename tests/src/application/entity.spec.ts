import { Entity, Transform, Restrict, VirtualProperty, GetterPrefix } from '@/application';

describe('Entity', () => {
  class Email {
    private value: string;
    constructor(email: string) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Invalid email format');
      }
      this.value = email;
    }

    getValue(): string {
      return this.value;
    }
  }

  class Complex {
    private readonly complexId: number;
    private readonly complexValue: string;

    constructor({ complexId, complexValue }: { complexId: number; complexValue: string }) {
      this.complexId = complexId;
      this.complexValue = complexValue;
    }

    getComplexId(): number {
      return this.complexId;
    }

    getComplexValue(): string {
      return this.complexValue.toUpperCase();
    }
  }

  type TestingEntityInput = {
    name: string
    email: string
    secret: string
    complex?: {
      id: number
      value: string
    }
    firstAccess?: boolean
  };

  class TestEntitySync extends Entity {
    private readonly testId: string;

    private readonly name: string;

    @Transform((email: Email) => email.getValue())
    private readonly email: Email;

    @Restrict()
    private readonly secret: string;

    @GetterPrefix('has')
    @Transform((complex: Complex) => ({ id: complex.getComplexId(), value: complex.getComplexValue() }))
    private readonly complex?: Complex

    @GetterPrefix('is')
    private readonly firstAccess?: boolean;

    @VirtualProperty('computed')
    private compute() {
      return this.name.toUpperCase();
    }

    private constructor({ name, email, complex, secret, firstAccess, testId }: { name: string; email: string; complex?: { id: number; value: string }; secret: string; firstAccess?: boolean; testId: string }) {
      super();
      this.testId = testId;
      this.name = name;
      this.email = new Email(email);
      this.secret = secret;
      if (complex) {
        this.complex = new Complex({ complexId: complex.id, complexValue: complex.value });
      }
      if (firstAccess) {
        this.firstAccess = firstAccess;
      }
      this.generateGetters();
    }

    static create(input: TestingEntityInput) {
      return new TestEntitySync({
        ...input,
        testId: 'simpleId'
      });
    }
  }

  class DocumentRef {
    private readonly documentId: string;

    constructor(documentId: string) {
      this.documentId = documentId;
    }

    getUrl(): string {
      return `https://documents.com/${this.documentId}`;
    }
  }

  class TestEntityTransformedObjectSync extends Entity {
    private readonly name: string;

    @Transform((document: DocumentRef) => ({ documentUrl: document.getUrl() }))
    private readonly document: DocumentRef;

    private constructor({ name, document }: { name: string; document: string }) {
      super();
      this.name = name;
      this.document = new DocumentRef(document);
    }

    static create(input: { name: string; document: string }) {
      return new TestEntityTransformedObjectSync(input);
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate getters for all properties', () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
      complex: { id: 1, value: 'abc' },
      firstAccess: true
    });

    expect(entity.getName()).toBe('test');
    expect(entity.hasComplex()).toBeInstanceOf(Complex);
    expect(entity.getEmail()).toBeInstanceOf(Email);
    expect(entity.getSecret()).toBe('confidential');
    expect(entity.isFirstAccess()).toBeTruthy();
    expect(entity.getTestId()).toBe('simpleId');
  });

  it('should generate getters for all properties with undefined for properties that are not defined', () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential'
    });

    expect(entity.getName()).toBe('test');
    expect(entity.getEmail().getValue()).toBe('4YlYX@example.com');
    expect(entity.getSecret()).toBe('confidential');
    expect(entity.getTestId()).toBe('simpleId');
  });

  it('should trnasform properties correctly when from is called', () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
      complex: { id: 1, value: 'abc' },
      firstAccess: true
    });
    const result = entity.from();

    expect(result).toEqual({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
      id: 1,
      value: 'ABC',
      firstAccess: true,
      testId: 'simpleId'
    });
    expect(result).not.toHaveProperty('complex');
  });

  it('should transform object properties by using returned key when from is called', () => {
    const entity = TestEntityTransformedObjectSync.create({
      name: 'test',
      document: '12345'
    });

    const result = entity.from();

    expect(result).toEqual({
      name: 'test',
      documentUrl: 'https://documents.com/12345'
    });
  });

  it('should transform properties correctly when from is called with undefined properties', () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential'
    });
    const result = entity.from();

    expect(result).toEqual({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
      testId: 'simpleId'
    });
  });

  it('should get properties correctly when to is called - without transform', () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential'
    });
    const result = entity.to(false);

    expect(result.email).toBeInstanceOf(Email);
    expect(result.name).toBe('test');
    expect(result).not.toHaveProperty('secret');
    expect(result.testId).toBe('simpleId');
  });

  it('should get properties correctly when to is called - with transform', () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential'
    });
    const result = entity.to();

    expect(result.email).toBe('4YlYX@example.com');
    expect(result.complex).toBeUndefined();
    expect(result.firstAccess).toBeUndefined();
    expect(result.name).toBe('test');
    expect(result).not.toHaveProperty('secret');
  });

  it('should get property from virtual', () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential'
    });

    const result = entity.to();

    expect(result.computed).toBe('TEST');
  });
});
