# Projeto Eternity

Este projeto consiste em um site para o Clã Eternity, uma comunidade de jogadores de Minecraft do servidor [Armageddon](https://armamc.net/). O site inclui diversas funcionalidades e informações úteis para os membros e visitantes.

## Funcionalidades Principais

- **Página Principal**
  - Apresenta informações gerais sobre o clã e suas atividades.
  - Navegação através de diferentes seções como "Sobre nós", "Juntar-se", "Cidade", "Discord", "Whatsapp", "Textura" e "Administração".

- **Seção Juntar-se**
  - Contém um formulário para solicitar recrutamento no Clã Eternity.
  - Os interessados preenchem informações como nome de usuário (nick), data de nascimento e área de interesse.
  - Após o envio do formulário, as solicitações são processadas pela administração do clã para análise e resposta.

- **Seção Administrativa (Painel)**
  - Área restrita para gerenciamento de membros, solicitações, banidos e histórico.
  - Tabelas interativas com colunas que podem ser ordenadas clicando nos cabeçalhos correspondentes.
  - Funcionalidade de pesquisa que filtra os valores exibidos na tabela de acordo com o que é digitado no campo de busca.
  - Cada tabela (como "Solicitações", "Membros", "Excluídos", "Histórico") possui botões de ação para editar membros, banir, ativar, ou excluir, dependendo do status e contexto.

## Tecnologias Utilizadas

- **HTML5**
- **CSS3** (utilização de folhas de estilo personalizadas)
- **JavaScript** (funcionalidades interativas e requisições assíncronas)
- **LightGallery** (biblioteca para galeria de imagens)
- **Fetch API** (para comunicação com o servidor)
- **Cookie API** (para armazenamento local de tokens de autenticação)

## Como Usar

1. Clone este repositório:

```
git clone https://github.com/EduardoBerot/Eternity.git
```

2. Abra o arquivo `index.html` em seu navegador para visualizar o site principal.

3. Para acessar a seção administrativa, navegue até `painel.html` e faça login utilizando as credenciais corretas.

## Autor

Este projeto foi desenvolvido por [Tiago Lima](https://github.com/tiagolimar) e [Eduardo Berot](https://github.com/tiagolimar).
