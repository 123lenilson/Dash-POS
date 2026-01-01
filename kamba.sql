-- --------------------------------------------------------
-- Anfitrião:                    127.0.0.1
-- Versão do servidor:           10.4.32-MariaDB - mariadb.org binary distribution
-- SO do servidor:               Win64
-- HeidiSQL Versão:              12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- A despejar estrutura da base de dados para h2
CREATE DATABASE IF NOT EXISTS `h2` /*!40100 DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci */;
USE `h2`;

-- A despejar estrutura para tabela h2.abertura_caixa
CREATE TABLE IF NOT EXISTS `abertura_caixa` (
  `idAbertura_caixa` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(200) DEFAULT NULL,
  `valor_ab` decimal(20,2) DEFAULT NULL,
  `Descricao` varchar(200) DEFAULT NULL,
  `dataa` date DEFAULT NULL,
  `hora` varchar(45) DEFAULT NULL,
  `valor_fecho` decimal(20,2) DEFAULT NULL,
  `dataa_fecho` varchar(200) DEFAULT NULL,
  `credito` decimal(20,2) DEFAULT NULL,
  `hora_fecho` varchar(45) DEFAULT NULL,
  `valor_total_venda` decimal(20,2) DEFAULT NULL,
  `Estado` varchar(200) DEFAULT NULL,
  `usuario` int(11) DEFAULT NULL,
  `caixa` varchar(200) DEFAULT NULL,
  `Nota_pay` decimal(20,2) DEFAULT NULL,
  `Numerario` varchar(200) DEFAULT NULL,
  `v1` decimal(20,2) DEFAULT NULL,
  `tpa` varchar(200) DEFAULT NULL,
  `v2` decimal(20,2) DEFAULT NULL,
  `transferencia` varchar(200) DEFAULT NULL,
  `v3` decimal(20,2) DEFAULT NULL,
  PRIMARY KEY (`idAbertura_caixa`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela h2.abertura_caixa: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela h2.categoria
CREATE TABLE IF NOT EXISTS `categoria` (
  `idCategoria` int(11) NOT NULL AUTO_INCREMENT,
  `Categoria` varchar(200) DEFAULT NULL,
  `impressora` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`idCategoria`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela h2.categoria: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela h2.garcon
CREATE TABLE IF NOT EXISTS `garcon` (
  `idgarcon` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`idgarcon`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela h2.garcon: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela h2.mesa
CREATE TABLE IF NOT EXISTS `mesa` (
  `idMesa` int(11) NOT NULL AUTO_INCREMENT,
  `Mesa` varchar(50) DEFAULT NULL,
  `Sala` varchar(45) DEFAULT NULL,
  `Lugar` int(11) DEFAULT NULL,
  `Estado` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idMesa`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela h2.mesa: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela h2.mesa_conta
CREATE TABLE IF NOT EXISTS `mesa_conta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mesa` varchar(200) DEFAULT NULL,
  `conta` varchar(200) DEFAULT NULL,
  `user` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela h2.mesa_conta: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela h2.pagamento
CREATE TABLE IF NOT EXISTS `pagamento` (
  `idPagamento` int(11) NOT NULL AUTO_INCREMENT,
  `Venda_idVenda` int(11) NOT NULL,
  `Pagamento` varchar(200) DEFAULT NULL,
  `Valor` decimal(20,2) DEFAULT NULL,
  `dataa` date DEFAULT NULL,
  `hora` varchar(45) DEFAULT NULL,
  `condicao` varchar(100) DEFAULT NULL,
  `n_doc` varchar(100) DEFAULT NULL,
  `usuario` int(11) DEFAULT NULL,
  `Ab` int(11) DEFAULT NULL,
  PRIMARY KEY (`idPagamento`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela h2.pagamento: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela h2.pedido_venda
CREATE TABLE IF NOT EXISTS `pedido_venda` (
  `idpv` int(11) NOT NULL AUTO_INCREMENT,
  `idpd` varchar(50) DEFAULT NULL,
  `nome` varchar(500) DEFAULT NULL,
  `qtd` double(20,2) DEFAULT NULL,
  `usu` int(11) DEFAULT NULL,
  `estado` varchar(100) DEFAULT NULL,
  `doc` varchar(100) DEFAULT NULL,
  `PRECO` varchar(50) DEFAULT NULL,
  `reter` decimal(20,2) DEFAULT NULL,
  PRIMARY KEY (`idpv`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela h2.pedido_venda: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela h2.sala
CREATE TABLE IF NOT EXISTS `sala` (
  `idSala` int(11) NOT NULL AUTO_INCREMENT,
  `sala` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idSala`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela h2.sala: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela h2.venda
CREATE TABLE IF NOT EXISTS `venda` (
  `idVenda` int(50) NOT NULL AUTO_INCREMENT,
  `Produto_idProduto` int(50) unsigned NOT NULL,
  `Qtd` decimal(20,2) DEFAULT NULL,
  `preconormal` varchar(200) DEFAULT NULL,
  `iva` decimal(20,2) DEFAULT NULL,
  `datavenda` date DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `N_fat` int(50) DEFAULT NULL,
  `desconto` decimal(20,2) DEFAULT NULL,
  `cliente` int(11) DEFAULT NULL,
  `Usuario` int(11) DEFAULT NULL,
  `Valor_dado` varchar(50) DEFAULT NULL,
  `Tipo_docum` varchar(45) DEFAULT NULL,
  `iva_valor` varchar(50) DEFAULT NULL,
  `caixa` int(50) DEFAULT NULL,
  `acrescimo` varchar(50) DEFAULT NULL,
  `condicao` varchar(200) DEFAULT NULL,
  `Justificacao` varchar(1000) DEFAULT NULL,
  `codigo_doc` varchar(500) DEFAULT NULL,
  `Nome` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `assinatura` varchar(500) DEFAULT NULL,
  `Hash` varchar(500) DEFAULT NULL,
  `referncia` varchar(45) DEFAULT NULL,
  `n_cliente` varchar(500) DEFAULT NULL,
  `Menos` varchar(100) DEFAULT NULL,
  `pagamento1` varchar(50) DEFAULT NULL,
  `valor1` varchar(50) DEFAULT NULL,
  `pagamento2` varchar(50) DEFAULT NULL,
  `valor2` varchar(50) DEFAULT NULL,
  `pagamento3` varchar(50) DEFAULT NULL,
  `valor3` varchar(50) DEFAULT NULL,
  `Motivo` varchar(500) DEFAULT NULL,
  `Descricao` varchar(500) DEFAULT NULL,
  `Referencia_a` varchar(100) DEFAULT NULL,
  `garcon` varchar(500) DEFAULT NULL,
  `OBS` varchar(500) DEFAULT NULL,
  `reter` varchar(50) DEFAULT NULL,
  `iva_converter` decimal(20,2) DEFAULT NULL,
  PRIMARY KEY (`idVenda`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela h2.venda: ~0 rows (aproximadamente)


-- A despejar estrutura da base de dados para wenkamba
CREATE DATABASE IF NOT EXISTS `wenkamba` /*!40100 DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci */;
USE `wenkamba`;

-- A despejar estrutura para tabela wenkamba.abertura
CREATE TABLE IF NOT EXISTS `abertura` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `valor` varchar(200) DEFAULT NULL,
  `descricao` varchar(200) DEFAULT NULL,
  `dataa` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `estado` varchar(50) DEFAULT NULL,
  `empresa` int(11) DEFAULT NULL,
  `usuario` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.abertura: ~2 rows (aproximadamente)
INSERT INTO `abertura` (`id`, `valor`, `descricao`, `dataa`, `estado`, `empresa`, `usuario`) VALUES
	(1, '222', '222', '2025-10-09 16:29:04', 'Aberto', 0, 2),
	(2, '022222', '2222', '2025-10-09 16:30:57', 'Aberto', 0, 1);

-- A despejar estrutura para tabela wenkamba.armazem
CREATE TABLE IF NOT EXISTS `armazem` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_empresa` int(11) DEFAULT NULL,
  `des_armazem` varchar(300) DEFAULT NULL,
  `localizacao` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- A despejar dados para tabela wenkamba.armazem: 0 rows
/*!40000 ALTER TABLE `armazem` DISABLE KEYS */;
/*!40000 ALTER TABLE `armazem` ENABLE KEYS */;

-- A despejar estrutura para tabela wenkamba.categoria
CREATE TABLE IF NOT EXISTS `categoria` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `categoria` varchar(500) DEFAULT NULL,
  `empresa` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`ID`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.categoria: ~4 rows (aproximadamente)
INSERT INTO `categoria` (`ID`, `categoria`, `empresa`) VALUES
	(1, 'GeralL', 'Geral'),
	(2, 'Comida', 'Comida'),
	(3, 'Casaco', 'Casaco'),
	(4, 'Materiais diversos', 'Materiais diversos');

-- A despejar estrutura para tabela wenkamba.cliente
CREATE TABLE IF NOT EXISTS `cliente` (
  `idcliente` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(500) DEFAULT NULL,
  `nif` varchar(500) DEFAULT NULL,
  `email` varchar(500) DEFAULT NULL,
  `morada` varchar(500) DEFAULT NULL,
  `endereco` varchar(500) DEFAULT NULL,
  `empresa` varchar(50) DEFAULT NULL,
  `usuario` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`idcliente`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.cliente: ~1 rows (aproximadamente)
INSERT INTO `cliente` (`idcliente`, `nome`, `nif`, `email`, `morada`, `endereco`, `empresa`, `usuario`) VALUES
	(2, 'Petelson 2', '007722283LA044A', 'cambonguefA@gmail.com', NULL, 'AA', 'wwwwwwwwwwwww', 'wwwwwwwwwwwww');

-- A despejar estrutura para tabela wenkamba.conta
CREATE TABLE IF NOT EXISTS `conta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conta` varchar(500) DEFAULT NULL,
  `empresa` int(11) DEFAULT NULL,
  `usuario` int(11) DEFAULT NULL,
  `dataa` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.conta: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela wenkamba.empresa
CREATE TABLE IF NOT EXISTS `empresa` (
  `id_empresa` int(11) DEFAULT NULL,
  `nome` varchar(300) DEFAULT NULL,
  `nif` varchar(50) DEFAULT NULL,
  `telefone1` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `data_creat` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.empresa: ~2 rows (aproximadamente)
INSERT INTO `empresa` (`id_empresa`, `nome`, `nif`, `telefone1`, `email`, `cidade`, `data_creat`) VALUES
	(NULL, 'ksoft', 'NIF da empresa', '949014761', 'cambonguef@gmail.com', 'Benfica', '2025-09-16'),
	(NULL, 'ksoft', 'NIF da empresa', '949014761', 'cambonguef@gmail.com', 'Benfica', '2025-09-16');

-- A despejar estrutura para tabela wenkamba.formapago
CREATE TABLE IF NOT EXISTS `formapago` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `forma` varchar(500) DEFAULT NULL,
  `valor` int(11) DEFAULT NULL,
  `N_FACTURA` varchar(200) DEFAULT NULL,
  `empresa` int(11) DEFAULT NULL,
  `usuario` int(11) DEFAULT NULL,
  `dataa` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.formapago: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela wenkamba.imposto
CREATE TABLE IF NOT EXISTS `imposto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `imposto` varchar(200) DEFAULT NULL,
  `percentagem` decimal(20,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.imposto: ~2 rows (aproximadamente)
INSERT INTO `imposto` (`id`, `imposto`, `percentagem`) VALUES
	(1, 'IVA(14%)', 14.00),
	(2, 'IVA(7%)', 7.00);

-- A despejar estrutura para tabela wenkamba.login
CREATE TABLE IF NOT EXISTS `login` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `codempresa` int(11) DEFAULT NULL,
  `Empresa` varchar(500) DEFAULT NULL,
  `Nome` varchar(500) DEFAULT NULL,
  `email` varchar(500) DEFAULT NULL,
  `endereco` int(11) DEFAULT NULL,
  `senha` varchar(500) DEFAULT NULL,
  `dica` varchar(500) DEFAULT NULL,
  `validade` varchar(200) DEFAULT NULL,
  `NIF` varchar(500) DEFAULT NULL,
  `contacto` varchar(500) DEFAULT NULL,
  `emailE` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.login: ~8 rows (aproximadamente)
INSERT INTO `login` (`ID`, `codempresa`, `Empresa`, `Nome`, `email`, `endereco`, `senha`, `dica`, `validade`, `NIF`, `contacto`, `emailE`) VALUES
	(1, 1, '1', 'Petelson', 'cambongue', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(2, 1, '1', 'Dino', 'ca', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
	(3, 3, NULL, 'Petelson', 'dino@gmail.com', NULL, '222', NULL, NULL, NULL, NULL, NULL),
	(4, NULL, NULL, 'cambongue@gmail.com', 'cambongue@gmail.com', NULL, '$2y$10$c5YsnKHlyE/Fn4Ao3G/E7ewRKci2mIpbGG1Q3VouV.pwKPErmxOx6', NULL, NULL, NULL, NULL, NULL),
	(5, NULL, NULL, 'cambongue@gmail.com', 'cambonguef@gmail.com', NULL, '$2y$10$.CRZx2NnXZ96MYGRTowMNeKdlMV1tfC9bUW2R7TuORLk/rVidnQMW', NULL, NULL, NULL, NULL, NULL),
	(6, NULL, NULL, 'Bernardino', 'camboanguef@gmail.com', NULL, '123', NULL, NULL, NULL, NULL, NULL),
	(7, NULL, NULL, 'Peter', 'rosa@gmail.com', NULL, '123', NULL, NULL, NULL, NULL, NULL),
	(8, NULL, NULL, 'Adriana', 'adriana@gmail.com', NULL, '$2y$10$mZ7otSiXtyNp2947G4naI.EgtCC9Rsp4Lv4M9hiLnp1CUSB.KKjFi', NULL, NULL, NULL, NULL, NULL);

-- A despejar estrutura para tabela wenkamba.notapagamento
CREATE TABLE IF NOT EXISTS `notapagamento` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `motivo` varchar(500) DEFAULT NULL,
  `conta` int(11) DEFAULT NULL,
  `caixa` int(11) DEFAULT NULL,
  `empresa` int(11) DEFAULT NULL,
  `usuario` int(11) DEFAULT NULL,
  `dataa` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.notapagamento: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela wenkamba.pagamento
CREATE TABLE IF NOT EXISTS `pagamento` (
  `idpagamento` int(11) NOT NULL AUTO_INCREMENT,
  `forma` varchar(500) DEFAULT NULL,
  `taxa` varchar(500) DEFAULT NULL,
  `ativo` varchar(500) DEFAULT NULL,
  `empresa` int(11) DEFAULT NULL,
  `usuario` int(11) DEFAULT NULL,
  PRIMARY KEY (`idpagamento`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.pagamento: ~3 rows (aproximadamente)
INSERT INTO `pagamento` (`idpagamento`, `forma`, `taxa`, `ativo`, `empresa`, `usuario`) VALUES
	(9, 'Cash', '', '', NULL, NULL),
	(10, 'TPA', '', '', NULL, NULL),
	(11, 'Transferencia', '', '', NULL, NULL);

-- A despejar estrutura para tabela wenkamba.pedido
CREATE TABLE IF NOT EXISTS `pedido` (
  `idpedido` int(11) NOT NULL AUTO_INCREMENT,
  `n_pedido` varchar(500) DEFAULT NULL,
  `descricao` varchar(500) DEFAULT NULL,
  `qtd` varchar(500) DEFAULT NULL,
  `preco` varchar(500) DEFAULT NULL,
  `desconto` varchar(500) DEFAULT NULL,
  `imposto` varchar(500) DEFAULT NULL,
  `dataa` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `hora` varchar(500) DEFAULT NULL,
  `conta` varchar(500) DEFAULT NULL,
  `mesa` varchar(500) DEFAULT NULL,
  `empresa` int(11) DEFAULT NULL,
  `usuario` int(11) DEFAULT NULL,
  PRIMARY KEY (`idpedido`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.pedido: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela wenkamba.produto
CREATE TABLE IF NOT EXISTS `produto` (
  `IDPRODUTO` int(11) NOT NULL AUTO_INCREMENT,
  `descricao` varchar(500) DEFAULT NULL,
  `categoria` int(11) DEFAULT NULL,
  `ps` varchar(500) DEFAULT NULL,
  `qtd` varchar(500) DEFAULT NULL,
  `validade` varchar(500) DEFAULT NULL,
  `compra` varchar(500) DEFAULT NULL,
  `venda` varchar(500) DEFAULT NULL,
  `barra` varchar(500) DEFAULT NULL,
  `obs` varchar(500) DEFAULT NULL,
  `empresa` varchar(50) DEFAULT NULL,
  `usuario` varchar(50) DEFAULT NULL,
  `impostos` int(11) DEFAULT NULL,
  PRIMARY KEY (`IDPRODUTO`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.produto: ~3 rows (aproximadamente)
INSERT INTO `produto` (`IDPRODUTO`, `descricao`, `categoria`, `ps`, `qtd`, `validade`, `compra`, `venda`, `barra`, `obs`, `empresa`, `usuario`, `impostos`) VALUES
	(7, 'Massa verde c', 2, '', '20', '2222-02-22', '3000.00', '200', '1234567865', NULL, '1', '1', 2),
	(8, 'Arroz doce', 3, 'fr', '2222222222222', '3333-03-31', '22222222', '2000.00', '2222222222222222', NULL, '2', '2', 1),
	(9, 'Bernardino Manuel Ferramenta Cambongue', 4, '', '22', '2222-02-22', '22222', '222', '2', NULL, '1', '1', 2);

-- A despejar estrutura para tabela wenkamba.users
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(11) DEFAULT NULL,
  `user_name` varchar(70) NOT NULL,
  `user_password` varchar(70) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.users: ~0 rows (aproximadamente)

-- A despejar estrutura para tabela wenkamba.venda
CREATE TABLE IF NOT EXISTS `venda` (
  `idVenda` int(50) NOT NULL AUTO_INCREMENT,
  `Produto_idProduto` int(50) unsigned NOT NULL,
  `Qtd` double(20,1) DEFAULT NULL,
  `preconormal` varchar(50) DEFAULT NULL,
  `iva` varchar(50) DEFAULT NULL,
  `datavenda` date DEFAULT NULL,
  `hora` time DEFAULT NULL,
  `N_fat` int(50) DEFAULT NULL,
  `desconto` decimal(20,2) DEFAULT NULL,
  `cliente` int(11) DEFAULT NULL,
  `Usuario` int(11) DEFAULT NULL,
  `Tipo_docum` varchar(45) DEFAULT NULL,
  `iva_valor` varchar(50) DEFAULT NULL,
  `caixa` int(50) DEFAULT NULL,
  `condicao` varchar(200) DEFAULT NULL,
  `Justificacao` varchar(1000) DEFAULT NULL,
  `codigo_doc` varchar(500) DEFAULT NULL,
  `Nome` varchar(200) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `assinatura` varchar(500) DEFAULT NULL,
  `Hash` varchar(500) DEFAULT NULL,
  `referncia` varchar(45) DEFAULT NULL,
  `n_cliente` varchar(500) DEFAULT NULL,
  `Motivo` varchar(500) DEFAULT NULL,
  `Descricao` varchar(500) DEFAULT NULL,
  `Referencia_a` varchar(100) DEFAULT NULL,
  `empresa` int(11) DEFAULT NULL,
  PRIMARY KEY (`idVenda`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- A despejar dados para tabela wenkamba.venda: ~0 rows (aproximadamente)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
