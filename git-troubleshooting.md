# Resolução de Problemas: Credenciais do Git e GitHub

## Problema
Ao tentar fazer um `git push` para um repositório no GitHub, você recebe um erro semelhante a este:
```text
remote: Repository not found.
fatal: repository 'https://github.com/usuario/repositorio.git/' not found
```

Isso geralmente acontece quando você utiliza **múltiplas contas do GitHub** na mesma máquina. O Git (através do Git Credential Manager do Windows) salva em cache as credenciais da conta logada anteriormente. Se essa conta antiga não tiver permissão para acessar o novo repositório, o GitHub retornará que o repositório "não foi encontrado".

## Solução
A forma mais prática de resolver isso e forçar o Git a solicitar um novo login para a conta correta é embutir o nome de usuário (username) na URL do repositório remoto (`origin`).

Ao fazer isso, o Git entende que essa conexão pertence a um usuário específico e não utiliza as credenciais genéricas salvas para o domínio `github.com`.

### Passo a Passo

1. **Verifique a URL atual do seu repositório remoto:**
   ```bash
   git remote -v
   ```
   *Exemplo de saída:* `origin https://github.com/weldercriss/universidade-suri.git (push)`

2. **Atualize a URL inserindo o seu usuário (ex: `weldercriss`) logo antes do `github.com`:**
   ```bash
   git remote set-url origin https://weldercriss@github.com/weldercriss/universidade-suri.git
   ```

3. **Faça o push novamente:**
   ```bash
   git push origin main
   ```

4. **Autentique-se:** Uma janela de autenticação do Git/GitHub abrirá no seu computador ou no seu navegador. Certifique-se de fazer o login usando a **conta correta** (a mesma que você colocou na URL).

Pronto! O push funcionará normalmente e as credenciais dessa conta ficarão salvas para este repositório.
