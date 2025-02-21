#!/bin/bash

RESET='\033[0m'
BOLD='\033[1m'
RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
CYAN='\033[36m'

#___________________________________
#CONFIGURAÇÕES 
user="SEU USUÁRIO DO GITHUB"

token="CRIE DEU TOKEN DO GITHUB E COLE AQUI, SE NAO SOUBER PROCURE NO GOOGLE"

email="SEU EMAIL DA SUA CONTA DO GITHUB"

#___________________________________







#NÃO MEXA ABAIXO
check_repo_exists() {
  response=$(curl -u "$user:$token" -s -o /dev/null -w "%{http_code}" "https://api.github.com/repos/$user/$repo_name")
  if [ "$response" -eq 200 ]; then
    return 0
  else
    return 1
  fi
}

create_repo() {
  response=$(curl -u "$user:$token" -s -o /dev/null -w "%{http_code}" \
    -X POST "https://api.github.com/user/repos" \
    -d "{\"name\":\"$repo_name\", \"private\":$repo_visibility}")

  if [ "$response" -eq 201 ]; then
    echo -e "${GREEN}Repositório '$repo_name' criado com sucesso no GitHub!${RESET}"
  else
    echo -e "${RED}Falha ao criar o repositório '$repo_name'. Código de erro: $response${RESET}"; exit 1
  fi
}

delete_repo() {
  response=$(curl -u "$user:$token" -s -o /dev/null -w "%{http_code}" -X DELETE "https://api.github.com/repos/$user/$repo_name")
  if [ "$response" -eq 204 ]; then
    echo -e "${GREEN}Repositório '$repo_name' deletado com sucesso do GitHub!${RESET}"
  else
    echo -e "${RED}Erro ao tentar deletar o repositório '$repo_name'. Código de erro: $response${RESET}"
  fi
}

initialize_git() {
  git config --global --add safe.directory "$(pwd)"
  git config --global user.name "$user"
  git config --global user.email "$email"

  # Criar o arquivo .gitignore com upar.sh ignorado
  if [ ! -f .gitignore ]; then
    echo "upar.sh" > .gitignore
  else
    grep -qxF "upar.sh" .gitignore || echo "upar.sh" >> .gitignore
  fi

  # Criar o arquivo README.md
  echo "# $repo_name" > README.md
  git init
  git add .

  # Adicionar todos os arquivos e pastas no diretório atual
  find . -type f -exec git add {} \;

  commit_count=$(git rev-list --count HEAD 2>/dev/null)
  if [ "$commit_count" -eq 0 ] || [ -z "$commit_count" ]; then
    git commit --allow-empty -m "Primeiro commit"
    git branch -M main
  fi
  
  if ! git remote get-url origin &>/dev/null; then
    git remote add origin "https://$user:$token@github.com/$user/$repo_name.git"
  fi

  git push -u origin main
  echo -e "${GREEN}Repositório '$repo_name' criado e arquivos enviados ao GitHub com sucesso!${RESET}"
}

update_repo() {
  git config --global --add safe.directory "$(pwd)"
  git config --global user.name "$user"
  git config --global user.email "$email"

  git add .
  # Adicionar todos os arquivos modificados
  find . -type f -exec git add {} \;

  commit_count=$(git rev-list --count HEAD 2>/dev/null)
  if [ "$commit_count" -eq 0 ] || [ -z "$commit_count" ]; then
    git commit --allow-empty -m "Commit inicial"
  else
    git commit -m "Atualização de arquivos"
  fi

  git push -u origin main
  echo -e "${GREEN}Repositório '$repo_name' atualizado com sucesso no GitHub!${RESET}"
}

while true; do
  clear
  echo -e "${CYAN}Escolha uma opção:${RESET}"
  echo -e "${YELLOW}1) Criar e upar para um novo repositório${RESET}"
  echo -e "${YELLOW}2) Atualizar repositório existente${RESET}"
  echo -e "${YELLOW}3) Deletar um repositório${RESET}"
  read -p "Opção (1, 2 ou 3): " option

  if [[ "$option" =~ ^[1-3]$ ]]; then
    break
  else
    echo -e "${RED}Opção inválida! Por favor, escolha uma opção válida (1, 2 ou 3).${RESET}"
    sleep 2
  fi
done

read -p "Digite o nome do repositório no GitHub: " repo_name

if [ "$option" -eq 1 ]; then
  echo -e "${CYAN}Escolha a visibilidade do repositório:${RESET}"
  echo -e "${YELLOW}1) Público${RESET}"
  echo -e "${YELLOW}2) Privado${RESET}"
  read -p "Opção (1 ou 2): " visibility_option

  case $visibility_option in
    1) repo_visibility=false ;;
    2) repo_visibility=true ;;
    *) echo -e "${RED}Opção inválida!${RESET}"; exit 1 ;;
  esac
fi

case $option in
  1)
    if check_repo_exists; then
      echo -e "${RED}O repositório '$repo_name' já existe!${RESET}"; exit 1
    fi
    create_repo
    initialize_git
    ;;
  2)
    if ! check_repo_exists; then
      echo -e "${RED}Repositório '$repo_name' não encontrado!${RESET}"; exit 1
    fi
    update_repo
    ;;
  3)
    if ! check_repo_exists; then
      echo -e "${RED}Repositório '$repo_name' não encontrado!${RESET}"; exit 1
    fi
    delete_repo
    ;;
  *)
    echo -e "${RED}Opção inválida!${RESET}"; exit 1
    ;;
esac

# Remover o diretório .git após a execução
rm -rf .git
echo -e "${GREEN}A pasta .git foi removida com sucesso!${RESET}"