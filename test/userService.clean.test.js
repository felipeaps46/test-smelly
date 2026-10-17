const { UserService } = require('../src/userService');

const STATUS_ATIVO = 'ativo';
const STATUS_INATIVO = 'inativo';

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService();
    userService._clearDB();
  });

  describe('createUser', () => {
    test('retorna o usuário com os dados informados', () => {
      // Arrange
      const nome = 'Fulano de Tal';
      const email = 'fulano@teste.com';
      const idade = 25;

      // Act
      const usuario = userService.createUser(nome, email, idade);

      // Assert
      expect(usuario).toMatchObject({ nome, email, idade });
    });

    test('cria usuário não administrador por padrão', () => {
      // Arrange
      const nome = 'Comum';

      // Act
      const usuario = userService.createUser(nome, 'comum@teste.com', 30);

      // Assert
      expect(usuario.isAdmin).toBe(false);
    });

    test('cria usuário administrador quando solicitado', () => {
      // Arrange
      const isAdmin = true;

      // Act
      const usuario = userService.createUser('Admin', 'admin@teste.com', 40, isAdmin);

      // Assert
      expect(usuario.isAdmin).toBe(true);
    });

    test('cria o usuário com status ativo', () => {
      // Arrange
      const idade = 25;

      // Act
      const usuario = userService.createUser('Fulano', 'fulano@teste.com', idade);

      // Assert
      expect(usuario.status).toBe(STATUS_ATIVO);
    });

    test('registra a data de criação do usuário', () => {
      // Arrange
      const antesDaCriacao = new Date();

      // Act
      const usuario = userService.createUser('Fulano', 'fulano@teste.com', 25);

      // Assert
      expect(usuario.createdAt.getTime()).toBeGreaterThanOrEqual(antesDaCriacao.getTime());
    });

    test('gera ids diferentes para usuários diferentes', () => {
      // Arrange
      const primeiro = userService.createUser('Alice', 'alice@email.com', 28);

      // Act
      const segundo = userService.createUser('Bob', 'bob@email.com', 32);

      // Assert
      expect(segundo.id).not.toBe(primeiro.id);
    });

    test('aceita usuário com exatamente 18 anos', () => {
      // Arrange
      const idadeMinima = 18;

      // Act
      const usuario = userService.createUser('Jovem', 'jovem@email.com', idadeMinima);

      // Assert
      expect(usuario.idade).toBe(idadeMinima);
    });

    test('lança erro ao criar usuário menor de idade', () => {
      // Arrange
      const criarMenorDeIdade = () => userService.createUser('Menor', 'menor@email.com', 17);

      // Act & Assert
      expect(criarMenorDeIdade).toThrow(/maior de idade/);
    });

    test.each([
      ['nome', [undefined, 'fulano@teste.com', 25]],
      ['email', ['Fulano', undefined, 25]],
      ['idade', ['Fulano', 'fulano@teste.com', undefined]],
    ])('lança erro quando o campo %s não é informado', (_campo, argumentos) => {
      // Arrange
      const criarSemCampoObrigatorio = () => userService.createUser(...argumentos);

      // Act & Assert
      expect(criarSemCampoObrigatorio).toThrow(/obrigatórios/);
    });
  });

  describe('getUserById', () => {
    test('retorna o usuário cadastrado com o id informado', () => {
      // Arrange
      const usuarioCriado = userService.createUser('Fulano', 'fulano@teste.com', 25);

      // Act
      const usuarioBuscado = userService.getUserById(usuarioCriado.id);

      // Assert
      expect(usuarioBuscado).toEqual(usuarioCriado);
    });

    test('retorna null quando o id não existe', () => {
      // Arrange
      const idInexistente = 'id-inexistente';

      // Act
      const usuarioBuscado = userService.getUserById(idInexistente);

      // Assert
      expect(usuarioBuscado).toBeNull();
    });
  });

  describe('deactivateUser', () => {
    test('retorna true ao desativar um usuário comum', () => {
      // Arrange
      const usuarioComum = userService.createUser('Comum', 'comum@teste.com', 30);

      // Act
      const resultado = userService.deactivateUser(usuarioComum.id);

      // Assert
      expect(resultado).toBe(true);
    });

    test('altera o status do usuário comum para inativo', () => {
      // Arrange
      const usuarioComum = userService.createUser('Comum', 'comum@teste.com', 30);

      // Act
      userService.deactivateUser(usuarioComum.id);

      // Assert
      expect(userService.getUserById(usuarioComum.id).status).toBe(STATUS_INATIVO);
    });

    test('retorna false ao tentar desativar um administrador', () => {
      // Arrange
      const usuarioAdmin = userService.createUser('Admin', 'admin@teste.com', 40, true);

      // Act
      const resultado = userService.deactivateUser(usuarioAdmin.id);

      // Assert
      expect(resultado).toBe(false);
    });

    test('mantém o administrador com status ativo após tentativa de desativação', () => {
      // Arrange
      const usuarioAdmin = userService.createUser('Admin', 'admin@teste.com', 40, true);

      // Act
      userService.deactivateUser(usuarioAdmin.id);

      // Assert
      expect(userService.getUserById(usuarioAdmin.id).status).toBe(STATUS_ATIVO);
    });

    test('retorna false quando o usuário não existe', () => {
      // Arrange
      const idInexistente = 'id-inexistente';

      // Act
      const resultado = userService.deactivateUser(idInexistente);

      // Assert
      expect(resultado).toBe(false);
    });
  });

  describe('generateUserReport', () => {
    test('identifica o documento como relatório de usuários', () => {
      // Arrange
      userService.createUser('Alice', 'alice@email.com', 28);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toMatch(/relatório de usuários/i);
    });

    test('lista o id de todos os usuários cadastrados', () => {
      // Arrange
      const alice = userService.createUser('Alice', 'alice@email.com', 28);
      const bob = userService.createUser('Bob', 'bob@email.com', 32);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain(alice.id);
      expect(relatorio).toContain(bob.id);
    });

    test('lista o nome de todos os usuários cadastrados', () => {
      // Arrange
      userService.createUser('Alice', 'alice@email.com', 28);
      userService.createUser('Bob', 'bob@email.com', 32);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain('Alice');
      expect(relatorio).toContain('Bob');
    });

    test('exibe o status atual de cada usuário', () => {
      // Arrange
      const usuario = userService.createUser('Alice', 'alice@email.com', 28);
      userService.deactivateUser(usuario.id);

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toContain(STATUS_INATIVO);
    });

    test('informa quando não há usuários cadastrados', () => {
      // Arrange: banco vazio (garantido pelo beforeEach)

      // Act
      const relatorio = userService.generateUserReport();

      // Assert
      expect(relatorio).toMatch(/nenhum usuário cadastrado/i);
    });
  });
});
