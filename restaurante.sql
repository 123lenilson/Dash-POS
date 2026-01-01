-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 04/09/2025 às 21:32
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `restaurante`
--
CREATE DATABASE IF NOT EXISTS `restaurante` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `restaurante`;

-- --------------------------------------------------------

--
-- Estrutura para tabela `cardapio`
--

CREATE TABLE `cardapio` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `preco` decimal(10,2) NOT NULL,
  `categoria_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `cardapio`
--

INSERT INTO `cardapio` (`id`, `nome`, `preco`, `categoria_id`) VALUES
(1, 'Pizza Margherita', 2500.00, 1),
(2, 'Pizza Calabresa', 2800.00, 1),
(3, 'Pizza Quatro Queijos', 3000.00, 1),
(4, 'Espaguete à Bolonhesa', 2200.00, 2),
(5, 'Lasanha de Frango', 2600.00, 2),
(6, 'Fettuccine Alfredo', 2400.00, 2),
(7, 'Refrigerante Lata', 600.00, 3),
(8, 'Suco Natural de Laranja', 1200.00, 3),
(9, 'Cerveja 600ml', 1500.00, 3),
(10, 'Pudim de Leite', 800.00, 4),
(11, 'Mousse de Chocolate', 900.00, 4),
(12, 'Torta de Limão', 1000.00, 4),
(13, 'Cheeseburger', 1800.00, 5),
(14, 'Hambúrguer Duplo', 2500.00, 5),
(15, 'Hambúrguer Vegetariano', 2000.00, 5),
(16, 'Sanduíche Natural de Frango', 1500.00, 6),
(17, 'Sanduíche de Atum', 1600.00, 6),
(18, 'Salada Caesar', 1800.00, 7),
(19, 'Salada Grega', 1700.00, 7),
(21, 'Camarão ao Alho e Óleo', 3800.00, 8),
(24, 'Batata Frita', 1200.00, 10);

-- --------------------------------------------------------

--
-- Estrutura para tabela `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `categorias`
--

INSERT INTO `categorias` (`id`, `nome`) VALUES
(10, 'Acompanhamentos'),
(8, 'Bebidas Alcoólicas'),
(7, 'Bebidas Não Alcoólicas'),
(5, 'Carnes'),
(1, 'Entradas'),
(3, 'Massas'),
(6, 'Peixes e Frutos do Mar'),
(4, 'Pizzas'),
(2, 'Saladas'),
(9, 'Sobremesas');

-- --------------------------------------------------------

--
-- Estrutura para tabela `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','atendente','contabil') DEFAULT 'atendente',
  `status` enum('ativo','inativo') DEFAULT 'ativo',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `users`
--

INSERT INTO `users` (`id`, `nome`, `email`, `password`, `role`, `status`, `created_at`) VALUES
(1, 'Administrador Geral', 'admin@heliotrading.com', '$2y$10$VX4yH3MNqOQKXGnO7K7x/uc3R7f8p6ZqV8R2IbI57sOEg2fZ1WjCS', 'admin', 'ativo', '2025-08-24 05:33:48'),
(2, 'Carlos Atendente', 'carlos@heliotrading.com', '$2y$10$VX4yH3MNqOQKXGnO7K7x/uc3R7f8p6ZqV8R2IbI57sOEg2fZ1WjCS', 'atendente', 'ativo', '2025-08-24 05:33:48'),
(3, 'Maria Contábil', 'maria@heliotrading.com', '$2y$10$VX4yH3MNqOQKXGnO7K7x/uc3R7f8p6ZqV8R2IbI57sOEg2fZ1WjCS', 'contabil', 'ativo', '2025-08-24 05:33:48');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `cardapio`
--
ALTER TABLE `cardapio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cardapio_categoria` (`categoria_id`);

--
-- Índices de tabela `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);

--
-- Índices de tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `cardapio`
--
ALTER TABLE `cardapio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de tabela `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `cardapio`
--
ALTER TABLE `cardapio`
  ADD CONSTRAINT `fk_cardapio_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
