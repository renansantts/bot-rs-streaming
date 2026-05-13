# Bot RS Streaming - Telegram

Bot para venda de produtos digitais no Telegram com:

- Menu com botões
- Produtos e estoque
- Saldo do cliente
- Compra automática com entrega
- PIX Mercado Pago
- Painel ADM básico
- Webhook Mercado Pago opcional

> Use apenas para produtos/contas que você tem autorização para vender.

## 1. Criar o bot no Telegram

1. Abra o Telegram
2. Procure por **@BotFather**
3. Envie `/newbot`
4. Escolha nome e username
5. Copie o TOKEN

## 2. Instalar

No PC/servidor:

```bash
npm install
```

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
BOT_TOKEN=seu_token_do_botfather
ADMIN_ID=seu_id_do_telegram
MP_ACCESS_TOKEN=seu_access_token_do_mercado_pago
PORT=3000
```

## 3. Descobrir seu ID do Telegram

Você pode usar bots como `@userinfobot` para ver seu ID numérico.

## 4. Rodar o bot

```bash
npm start
```

No Telegram, abra seu bot e mande:

```txt
/start
```

## 5. Comandos principais

Cliente:

```txt
/start
/menu
/pix 10
/check ID_DO_PAGAMENTO
```

Admin:

```txt
/admin
/addproduto HBO Max Premium|12|email1 senha1;email2 senha2
```

## 6. Mercado Pago

Você precisa criar uma aplicação no Mercado Pago Developers e pegar o **Access Token**.

Para PIX, o bot cria pagamento via API e retorna o **PIX copia e cola**.

A documentação oficial do Mercado Pago diz que o Pix pelo Checkout Transparente pode gerar QR Code/código de pagamento, e os webhooks servem para receber notificações em tempo real.

## 7. Hospedagem 24h

Pode hospedar em:

- Render
- Railway
- VPS
- Replit
- Termux no Android, apenas para teste

Para webhook do Mercado Pago funcionar bem, precisa de uma URL pública HTTPS.

## 8. Editar produtos iniciais

Abra `database.json` e edite a parte:

```json
"products": []
```

Cada produto tem:

```json
{
  "id": "netflix-premium",
  "name": "Netflix Premium",
  "price": 13,
  "stock": ["email senha", "email senha"]
}
```
