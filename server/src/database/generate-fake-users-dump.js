/**
 * Gera o arquivo seed-fake-users.json com 26.000 usuários fake (nome, cpf válido, payment_day).
 * Nomes: lista dos 500 nomes mais comuns no Brasil (IBGE/ranking).
 * CPF com dígitos verificadores corretos. Rode: node src/database/generate-fake-users-dump.js
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOTAL = 26000;

// 500 nomes mais comuns no Brasil (ranking - lista fornecida)
const firstNames = [
  'Maria', 'Jose', 'Ana', 'Joao', 'Antonio', 'Francisco', 'Carlos', 'Paulo', 'Pedro', 'Lucas',
  'Luiz', 'Marcos', 'Luis', 'Gabriel', 'Rafael', 'Francisca', 'Daniel', 'Marcelo', 'Bruno', 'Eduardo',
  'Felipe', 'Raimundo', 'Rodrigo', 'Antonia', 'Manoel', 'Mateus', 'Andre', 'Adriana', 'Juliana', 'Fernando',
  'Marcia', 'Fabio', 'Leonardo', 'Gustavo', 'Fernanda', 'Patricia', 'Guilherme', 'Aline', 'Leandro', 'Tiago',
  'Sandra', 'Anderson', 'Camila', 'Ricardo', 'Marcio', 'Amanda', 'Jorge', 'Bruna', 'Sebastiao', 'Jessica',
  'Alexandre', 'Roberto', 'Leticia', 'Julia', 'Edson', 'Luciana', 'Diego', 'Vitor', 'Vanessa', 'Sergio',
  'Mariana', 'Gabriela', 'Vera', 'Vitoria', 'Larissa', 'Claudia', 'Beatriz', 'Luana', 'Rita', 'Sonia',
  'Claudio', 'Matheus', 'Renata', 'Thiago', 'Eliane', 'Josefa', 'Simone', 'Geraldo', 'Adriano', 'Luciano',
  'Julio', 'Natalia', 'Renato', 'Cristiane', 'Carla', 'Debora', 'Alex', 'Rosangela', 'Jaqueline', 'Rosa',
  'Vinicius', 'Daniela', 'Aparecida', 'Marlene', 'Terezinha', 'Raimunda', 'Rogerio', 'Samuel', 'Andreia', 'Fabiana',
  'Lucia', 'Raquel', 'Angela', 'Rafaela', 'Ronaldo', 'Joana', 'Mario', 'Flavio', 'Igor', 'Douglas',
  'Luzia', 'Elaine', 'Davi', 'Jeferson', 'Manuel', 'Daniele', 'Regina', 'Cicero', 'Daiane', 'Sueli',
  'Alessandra', 'Victor', 'Miguel', 'Isabel', 'Robson', 'Mauricio', 'Sara', 'Flavia', 'Bianca', 'Danilo',
  'Erica', 'Viviane', 'Henrique', 'Caio', 'Reginaldo', 'Silvana', 'Priscila', 'Paula', 'Luiza', 'Tereza',
  'Isabela', 'Marta', 'Joaquim', 'Benedito', 'Caroline', 'Gilberto', 'Janaina', 'Laura', 'Marli', 'Tatiane',
  'Marina', 'Marco', 'Alan', 'Silvia', 'Monica', 'Tais', 'Michele', 'Nelson', 'Solange', 'Edna',
  'Fatima', 'Helena', 'Cristiano', 'Cristina', 'Alice', 'Carolina', 'Rosana', 'Elias', 'Wilson', 'Valdir',
  'Andressa', 'Celia', 'Valeria', 'Eliana', 'Sabrina', 'Emerson', 'Luan', 'Andrea', 'David', 'Tania',
  'Renan', 'Barbara', 'Severino', 'Thais', 'Denise', 'Roseli', 'Fabricio', 'Mauro', 'Gisele', 'Jonas',
  'Marilene', 'Katia', 'Eva', 'Gilmar', 'Jean', 'Fabiano', 'Milena', 'Wesley', 'Diogo', 'Adilson',
  'Jair', 'Eduarda', 'Alessandro', 'Everton', 'Osvaldo', 'Elisangela', 'Vilma', 'Geovana', 'Willian', 'Gilson',
  'Luciene', 'Joel', 'Tamires', 'Roberta', 'Tatiana', 'Elza', 'Talita', 'Silvio', 'Marcela', 'Pamela',
  'Helio', 'Irene', 'Vania', 'Josiane', 'Livia', 'Maicon', 'Reinaldo', 'Pablo', 'Artur', 'Vagner',
  'Ivone', 'Cintia', 'Valter', 'Lais', 'Ivan', 'Celso', 'Taina', 'Cleiton', 'Benedita', 'Sebastiana',
  'Joice', 'Vanderlei', 'Arthur', 'Mirian', 'Vicente', 'Milton', 'Domingos', 'Sandro', 'Wagner', 'Moises',
  'Gabriele', 'Edilson', 'Elizabete', 'Ademir', 'Angelica', 'Adao', 'Brenda', 'Evandro', 'Veronica', 'Cesar',
  'Karina', 'Rosilene', 'Nair', 'Valmir', 'Murilo', 'Juliano', 'Neusa', 'Margarida', 'Neuza', 'Edvaldo',
  'Neide', 'Ailton', 'Raissa', 'Junior', 'Maiara', 'Nicolas', 'Breno', 'Franciele', 'Lorena', 'Samara',
  'Ruan', 'Lilian', 'Janete', 'Cicera', 'Alberto', 'Giovana', 'Severina', 'Cleide', 'Lara', 'Nicole',
  'Rubens', 'Augusto', 'Nilton', 'Cecilia', 'Yasmin', 'Conceicao', 'Cleber', 'Osmar', 'Ingrid', 'Selma',
  'Leila', 'Raiane', 'Nilson', 'Orlando', 'Hugo', 'Otavio', 'Ester', 'Vinicios', 'Regiane', 'Italo',
  'Marisa', 'Eunice', 'Wilian', 'Kelly', 'Tainara', 'Alisson', 'Iara', 'Aparecido', 'Israel', 'Joelma',
  'Marinalva', 'Edmilson', 'Teresinha', 'Rebeca', 'Geralda', 'Josue', 'Cleonice', 'Iraci', 'Alexandra', 'Jenifer',
  'Mara', 'Elizangela', 'Liliane', 'Lidia', 'Iracema', 'Lidiane', 'Marilia', 'Gerson', 'Sheila', 'Caua',
  'Naiara', 'Ines', 'Sidnei', 'Poliana', 'Dalva', 'Lurdes', 'Emanuel', 'Teresa', 'Valdeci', 'Zilda',
  'Lucilene', 'Clara', 'Rosane', 'Jaime', 'Valdemar', 'Ivonete', 'Edivaldo', 'Luciane', 'Isadora', 'Arnaldo',
  'Lucimar', 'Nilza', 'Cristian', 'Moacir', 'Paloma', 'Ismael', 'Damiao', 'Michel', 'Isaias', 'Carmem',
  'Nivaldo', 'Suelen', 'Jairo', 'Angelo', 'Rosimeire', 'Jane', 'Valdecir', 'Wellington', 'Alexandro', 'Cleusa',
  'Vanda', 'Ilda', 'Denis', 'Valdemir', 'Eliene', 'Wanderson', 'Rian', 'Claudinei', 'Jailson', 'Mayara',
  'Celio', 'Diana', 'Sofia', 'Yuri', 'Denilson', 'Ariane', 'Iago', 'Mariane', 'Suzana', 'Eder',
  'Clarice', 'Daiana', 'Charles', 'Marlon', 'Alison', 'Eric', 'Jonatan', 'Edilene', 'Elton', 'Weslei',
  'Miriam', 'Natanael', 'Erick', 'Elisabete', 'Eliete', 'Karine', 'Kauan', 'Agnaldo', 'Odete', 'Jussara',
  'Izabel', 'Karen', 'Luisa', 'Odair', 'Geovane', 'Alana', 'Cassia', 'Monique', 'Catia', 'Walter',
  'Deise', 'Isabele', 'Arlindo', 'Evelin', 'Keila', 'Michael', 'Adriele', 'Andreza', 'Joseane', 'Alvaro',
  'Yasmim', 'Lourdes', 'Ezequiel', 'Everaldo', 'Almir', 'Alzira', 'Nadir', 'Carina', 'Darci', 'Erika',
  'Ivo', 'Gislaine', 'Ramon', 'Ademar', 'Emily', 'Jamile', 'Claudete', 'Catarina', 'Filipe', 'William',
  'Gessica', 'Manuela', 'Jonatas', 'Elen', 'Geni', 'Telma', 'Ivanildo', 'Romario', 'Arlete', 'Heloisa',
  'Valdirene', 'Elizete', 'Valquiria', 'Jackson', 'Eloisa', 'Kaua', 'Natan', 'Gilvan', 'Josimar', 'Jonathan',
  'Alfredo', 'Juliane', 'Zelia', 'Raul', 'Dirce', 'Emili', 'Jandira', 'Bernardo', 'Gean', 'Fabiola',
  'Carmen', 'Estefani', 'Josias', 'Rejane', 'Rodolfo', 'Amelia', 'Maira', 'Lazaro', 'Lucio', 'Vilmar'
];

// Sobrenomes brasileiros + estrangeiros (vários países)
const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Rocha', 'Almeida',
  'Nascimento', 'Araújo', 'Melo', 'Barbosa', 'Cardoso', 'Dias', 'Castro', 'Campos',
  'Teixeira', 'Moreira', 'Nunes', 'Mendes', 'Freitas', 'Cavalcanti', 'Ramos', 'Pinto',
  'Correia', 'Monteiro', 'Vieira', 'Moura', 'Lopes', 'Cruz', 'Machado', 'Azevedo',
  'Dantas', 'Bezerra', 'Siqueira', 'Tavares', 'Xavier', 'Guedes', 'Brito',
  'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci',
  'Marino', 'Greco', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Giordano', 'Rizzo',
  'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Hernández', 'Pérez', 'Sánchez',
  'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes', 'Morales',
  'Fonseca', 'Magalhães', 'Soares', 'Baptista', 'Coelho', 'Vaz', 'Simões', 'Andrade',
  'Schmidt', 'Müller', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker',
  'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura',
  'Hassan', 'Hussein', 'Ali', 'Mohamed', 'Ibrahim', 'Salem', 'Maluf', 'Jafet', 'Curi',
  'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy',
  'Kowalski', 'Wisniewski', 'Dabrowski', 'Kaminski', 'Lewandowski', 'Zielinski', 'Nowak'
];

/**
 * Gera um CPF válido (com dígitos verificadores corretos).
 */
function gerarCpfValido() {
  let base = [];
  for (let i = 0; i < 9; i++) {
    base.push(Math.floor(Math.random() * 10));
  }
  if (new Set(base).size === 1) base[0] = (base[0] + 1) % 10;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += base[i] * (10 - i);
  let d1 = (soma * 10) % 11;
  if (d1 === 10) d1 = 0;
  base.push(d1);
  soma = 0;
  for (let i = 0; i < 10; i++) soma += base[i] * (11 - i);
  let d2 = (soma * 10) % 11;
  if (d2 === 10) d2 = 0;
  base.push(d2);
  return base.join('');
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const data = [];
for (let i = 0; i < TOTAL; i++) {
  data.push({
    name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
    cpf: gerarCpfValido(),
    payment_day: randomInt(1, 31)
  });
}

const outPath = join(__dirname, 'seed-fake-users.json');
writeFileSync(outPath, JSON.stringify(data), 'utf8');
console.log(`✅ Dump gerado: ${outPath} (${TOTAL.toLocaleString('pt-BR')} usuários fake, 500 nomes, CPFs válidos)`);
