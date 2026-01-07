import { Entity, Serialize, Restrict, VirtualProperty, GetterPrefix } from '@/application/entity';

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


    constructor({ complexId, complexValue }: { complexId: number, complexValue: string }) {
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

    @Serialize((email: Email) => email.getValue())
    private readonly email: Email;

    @Restrict()
    private readonly secret: string;

    @GetterPrefix('has')
    @Serialize((complex: Complex) => ({ id: complex.getComplexId(), value: complex.getComplexValue() }))
    private readonly complex?: Complex

    @GetterPrefix('is')
    private readonly firstAccess?: boolean;

    @VirtualProperty('computed')
    private compute() {
      return this.name.toUpperCase();
    }

    private constructor({ name, email, complex, secret, firstAccess, testId }: { name: string, email: string, complex?: { id: number, value: string }, secret: string, firstAccess?: boolean, testId: string }) {
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

  class Photo {
    private readonly file: any;

    constructor(file: any) {
      this.file = file;
    }

    getSavedObjectUrl(): Promise<string> {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('https://blobstorage.com/file/1234567890');
        }, 1000);
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

  class AsyncDocumentRef {
    private readonly documentId: string;

    constructor(documentId: string) {
      this.documentId = documentId;
    }

    async getUrl(): Promise<string> {
      return new Promise((resolve) => {
        setTimeout(() => resolve(`https://documents.com/${this.documentId}`), 1000);
      });
    }
  }

  class TestEntityAsync extends Entity {

    private readonly testId: string;

    private readonly name: string;

    @Serialize(async (photo: Photo) => await photo.getSavedObjectUrl())
    private readonly photo: Photo;

    @Restrict()
    private readonly secret: string;

    private constructor({ name, file, testId }: { name: string, file: any, testId: string }) {
      super();
      this.testId = testId;
      this.name = name;
      this.photo = new Photo(file);
      this.secret = 'confidential';
      this.generateGetters();
    }

    @VirtualProperty('computed')
    private async compute() {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.name.toUpperCase() + ' ASYNC');
        }, 1000);
      });
    }

    static create(input: { name: string, file: any }) {
      return new TestEntityAsync({
        ...input,
        testId: 'simpleId'
      });
    }
  }

  class TestEntitySerializedObjectSync extends Entity {
    private readonly name: string;

    @Serialize((document: DocumentRef) => ({ documentUrl: document.getUrl() }))
    private readonly document: DocumentRef;

    private constructor({ name, document }: { name: string, document: string }) {
      super();
      this.name = name;
      this.document = new DocumentRef(document);
    }

    static create(input: { name: string, document: string }) {
      return new TestEntitySerializedObjectSync(input);
    }
  }

  class TestEntitySerializedObjectAsync extends Entity {
    private readonly name: string;

    @Serialize(async (document: AsyncDocumentRef) => ({ asyncDocumentUrl: await document.getUrl() }))
    private readonly document: AsyncDocumentRef;

    private constructor({ name, document }: { name: string, document: string }) {
      super();
      this.name = name;
      this.document = new AsyncDocumentRef(document);
    }

    static create(input: { name: string, document: string }) {
      return new TestEntitySerializedObjectAsync(input);
    }
  }

  class TestEntityWithoutStrategyId extends Entity {
    private readonly name: string;
    private readonly testId: string;

    private constructor({ name, testId }: { name: string, testId: string }) {
      super();
      this.name = name;
      this.testId = testId;
    }

    static create({ name }: { name: string }) {
      return new TestEntityWithoutStrategyId({
        name,
        testId: 'simpleId'
      });
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate getters for all properties', async () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
      complex: { id: 1, value: 'abc' },
      firstAccess: true
    })

    expect(entity.getName()).toBe('test');
    expect(entity.hasComplex()).toBeInstanceOf(Complex);
    expect(entity.getEmail()).toBeInstanceOf(Email);
    expect(entity.getSecret()).toBe('confidential');
    expect(entity.isFirstAccess()).toBeTruthy();
    expect(entity.getTestId()).toBe('simpleId');
  });

  it('should generate getters for all properties with undefined for properties that are not defined', async () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
    })

    expect(entity.getName()).toBe('test');
    expect(entity.getEmail().getValue()).toBe('4YlYX@example.com');
    expect(entity.getSecret()).toBe('confidential');
    expect(entity.getTestId()).toBe('simpleId');
  });

  it('should serialize properties correctly when toEntity is called - sync', async () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
      complex: { id: 1, value: 'abc' },
      firstAccess: true
    })
    const result = entity.toEntity()

    expect(result).toEqual({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
      complex: { id: 1, value: 'ABC' },
      firstAccess: true,
      testId: 'simpleId'
    });
  });

  it('should serialize object properties by using returned key when toEntity is called', async () => {
    const entity = TestEntitySerializedObjectSync.create({
      name: 'test',
      document: '12345'
    });

    const result = entity.toEntity();

    expect(result).toEqual({
      name: 'test',
      documentUrl: 'https://documents.com/12345'
    });
  });

  it('should serialize properties correctly when toAsyncEntity is called - async', async () => {
    const entity = TestEntityAsync.create({
      name: 'test',
      file: 'file.jpg'
    })

    const result = await entity.toAsyncEntity()

    expect(result).toEqual({
      name: 'test',
      photo: 'https://blobstorage.com/file/1234567890',
      secret: 'confidential',
      testId: 'simpleId'
    });
  });

  it('should serialize object properties by using returned key when toAsyncEntity is called', async () => {
    const entity = TestEntitySerializedObjectAsync.create({
      name: 'test',
      document: '12345'
    });

    const result = await entity.toAsyncEntity();

    expect(result).toEqual({
      name: 'test',
      asyncDocumentUrl: 'https://documents.com/12345'
    });
  });

  it('should serialize properties correctly when toEntity is called with undefined properties', async () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
    })
    const result = entity.toEntity()

    expect(result).toEqual({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
      testId: 'simpleId'
    });
  });

  it('should get properties correctly when toData is called - sync - without serialize', async () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
    })
    const result = entity.toData()

    expect(result.email).toBeInstanceOf(Email);
    expect(result.name).toBe('test');
    expect(result).not.toHaveProperty('secret');
    expect(result.testId).toBe('simpleId');
  });

  it('should get properties correctly when toData is called - sync - with serialize', async () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
    })
    const result = entity.toData({ serialize: true })

    expect(result.email).toBe('4YlYX@example.com');
    expect(result.complex).toBeUndefined();
    expect(result.firstAccess).toBeUndefined();
    expect(result.name).toBe('test');
    expect(result).not.toHaveProperty('secret');
  });

  it('should get properties correctly when toData is called - async - without serialize', async () => {
    const entity = TestEntityAsync.create({
      name: 'test',
      file: 'file.jpg'
    })
    const result = await entity.toAsyncData({ serialize: false })

    expect(result.photo).toBeInstanceOf(Photo);
    expect(result.name).toBe('test');
  });

  it('should get properties correctly when toData is called - async - with serialize', async () => {
    const entity = TestEntityAsync.create({
      name: 'test',
      file: 'file.jpg'
    })
    const result = await entity.toAsyncData()

    expect(result.photo).toBe('https://blobstorage.com/file/1234567890');
    expect(result.name).toBe('test');
  });

  it('should get property from virtual - sync', async () => {
    const entity = TestEntitySync.create({
      name: 'test',
      email: '4YlYX@example.com',
      secret: 'confidential',
    })

    const result = entity.toData()

    expect(result.computed).toBe('TEST');
  });

  it('should get property from virtual - async', async () => {
    const entity = TestEntityAsync.create({
      name: 'test',
      file: 'file.jpg'
    })

    const result = await entity.toAsyncData()

    expect(result.computed).toBe('TEST ASYNC');
  });
});
