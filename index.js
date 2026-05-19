import 'dotenv/config'
import { Telegraf, Markup } from 'telegraf'
import express from 'express'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

const BOT_TOKEN = process.env.BOT_TOKEN
const ADMIN_ID = String(process.env.ADMIN_ID || '')
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN
const PORT = process.env.PORT || 3000

if (!BOT_TOKEN) {
  console.error('ERRO: coloque o BOT_TOKEN no arquivo .env')
  process.exit(1)
}

const bot = new Telegraf(BOT_TOKEN)
const app = express()
app.use(express.json())

const DB_FILE = './database.json'

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

function getUser(db, telegramId) {
  const id = String(telegramId)
  if (!db.users[id]) {
    db.users[id] = {
      id,
      balance: 0,
      purchases: []
    }
    saveDB(db)
  }
  return db.users[id]
}

function money(value) {
  return `R$ ${Number(value).toFixed(2).replace('.', ',')}`
}

function isAdmin(ctx) {
  return String(ctx.from.id) === ADMIN_ID
}
// MENU PRINCIPAL
function mainMenu() {
  return {
    reply_markup: {
      keyboard: [
        ['🎬 MENU PRINCIPAL'],
        ['👤 PERFIL', '💰 ADICIONAR SALDO'],
        ['🏆 RANKING'],
        ['👨🏻‍💻 SUPORTE', '📍 ALUGAR BOT'],
        ['🔎 PESQUISAR SERVIÇO']
      ],
      resize_keyboard: true
    }
  }
}

bot.hears('🎬 MENU PRINCIPAL', (ctx) => {
  mostrarProdutos(ctx)
})

// PAINEL ADMIN
function adminMenu() {
  return {
    reply_markup: {
      keyboard: [
        ['📦 Adicionar Produto'],
        ['📥 Adicionar Estoque'],
        ['🛒 Meus Pedidos / Vendas'],
        ['📋 Listar Produtos'],
        ['✏️ Editar Produto'],
        ['🗑 Remover Produto'],
        ['💰 Adicionar Saldo Manual'],
        ['👤 Ver Clientes'],
        ['👥 Afiliados'],
        ['📢 Enviar Aviso'],
        ['🎁 Gift Card'],
        ['📊 Estatísticas'],
        ['⚙️ Configurações'],
        ['🔙 Voltar']
      ],
      resize_keyboard: true
    }
  }
}

bot.start(async (ctx) => {
  const db = loadDB()
  const user = getUser(db, ctx.from.id)

  ctx.reply(`
🤩 Bem-vindo à melhor loja de streamings do Telegram! ✨
🎬 Logins rápidos, seguros e pelo melhor preço!

❗ Não encontrou o login que procura?
Entre em contato com nosso suporte, estamos à disposição para te ajudar! 😊

⏳ Suporte disponível de 24h a 48h! 🕒

ℹ️ Seus Dados:
🆔 ID: ${ctx.from.id}
💰 Saldo Atual: ${money(user.balance)}
🏆 Bônus De Indicação: R$ 0,00
`, mainMenu())
})

bot.command('menu', (ctx) => {
  const db = loadDB()
  const user = getUser(db, ctx.from.id)

  ctx.reply(`🏠 Menu principal\n💰 Saldo: ${money(user.balance)}`, mainMenu())
})

bot.command('admin', (ctx) => {
  if (String(ctx.from.id) !== ADMIN_ID) {
    return ctx.reply(`❌ Você não tem permissão.\n\nSeu ID é: ${ctx.from.id}`)
  }

  ctx.reply(`
👑 PAINEL ADMIN

📦 Adicionar Produto
📥 Adicionar Estoque
🛒 Meus Pedidos / Vendas
📋 Listar Produtos
✏️ Editar Produto
🗑 Remover Produto
💰 Adicionar Saldo Manual
👤 Ver Clientes
👥 Afiliados

📢 Enviar Aviso
🎁 Gift Card
📊 Estatísticas
⚙️ Configurações
`, adminMenu())
})

bot.command('admin', (ctx) => {
    if (String(ctx.from.id) !== ADMIN_ID) {
        return ctx.reply(`❌ Você não tem permissão.\n\nSeu ID é: ${ctx.from.id}`)
    }

    ctx.reply(`
👑 PAINEL ADMIN

Escolha uma opção abaixo:
`, {
        reply_markup: {
            keyboard: [
                ['📦 Adicionar Produto'],
                ['📥 Adicionar Estoque'],
                ['🛒 Meus Pedidos / Vendas'],
                ['📋 Listar Produtos'],
                ['✏️ Editar Produto'],
                ['🗑 Remover Produto'],
                ['💰 Adicionar Saldo Manual'],
                ['👤 Ver Clientes'],
                ['👥 Afiliados'],
                ['📢 Enviar Aviso'],
                ['🎁 Gift Card'],
                ['📊 Estatísticas'],
                ['⚙️ Configurações'],
                ['🔙 Voltar']
            ],
            resize_keyboard: true
        }
    })
})
// =========================
// ADICIONAR PRODUTO
// =========================

bot.hears('📦 Adicionar Produto', (ctx) => {
  if (String(ctx.from.id) !== ADMIN_ID) {
    return ctx.reply('❌ Sem permissão.')
  }

  ctx.reply(`
📦 ENVIE:

/addproduto Nome|Valor

Exemplo:
/addproduto Netflix Premium|15
`)
})

bot.command('addproduto', (ctx) => {
  if (String(ctx.from.id) !== ADMIN_ID) {
    return ctx.reply('❌ Sem permissão.')
  }

  const db = loadDB()

  if (!db.products) {
    db.products = []
  }

  const text = ctx.message.text.replace('/addproduto', '').trim()

  const partes = text.split('|')

  if (partes.length < 2) {
    return ctx.reply('❌ Use: /addproduto Nome|Valor')
  }

  const nome = partes[0].trim()
  const valor = Number(partes[1].replace(',', '.'))

  if (!nome || !valor) {
    return ctx.reply('❌ Dados inválidos.')
  }

  const produto = {
    id: Date.now().toString(),
    name: nome,
    price: valor,
    stock: []
  }

  db.products.push(produto)

  saveDB(db)

  ctx.reply(`
✅ PRODUTO ADICIONADO

📦 Nome: ${produto.name}
💰 Valor: R$ ${produto.price}
🆔 ID: ${produto.id}
`)
})

// =========================
// LISTAR PRODUTOS
// =========================
bot.hears('📦 Adicionar Produto', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  ctx.reply(`
📦 Para adicionar produto com estoque junto:

/addproduto Nome|Valor|Email|Senha|Tela|PIN|Descrição

Exemplo:
/addproduto Disney Privada|9|email@gmail.com|senha123|Tela 1|sem pin|APENAS 1 DISPOSITIVO
`)
})

bot.command('addproduto', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  const db = loadDB()
  const text = ctx.message.text.replace('/addproduto', '').trim()
  const [name, priceText, email, senha, tela, pin, descricao] = text.split('|')

  if (!name || !priceText || !email || !senha) {
    return ctx.reply('❌ Use: /addproduto Nome|Valor|Email|Senha|Tela|PIN|Descrição')
  }

  const price = Number(priceText.replace(',', '.'))
  if (!price) return ctx.reply('❌ Valor inválido.')

  const produto = {
    id: Date.now().toString(),
    name: name.trim(),
    price,
    description: descricao ? descricao.trim() : '',
    stock: [{
      email: email.trim(),
      senha: senha.trim(),
      tela: tela ? tela.trim() : 'Acesso único',
      pin: pin ? pin.trim() : 'sem pin'
    }]
  }

  db.products.push(produto)
  saveDB(db)

  ctx.reply(`
✅ PRODUTO ADICIONADO

🆔 ID: ${produto.id}
📦 Produto: ${produto.name}
💰 Valor: ${money(produto.price)}
📥 Estoque: ${produto.stock.length}
`)
})

// 📥 ADICIONAR ESTOQUE
bot.hears('📥 Adicionar Estoque', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  ctx.reply(`
📥 Para adicionar estoque:

/estoque ID|Email|Senha|Tela|PIN

Exemplo:
/estoque 123456|email@gmail.com|senha123|Tela 2|2222
`)
})

bot.command('estoque', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  const db = loadDB()
  const text = ctx.message.text.replace('/estoque', '').trim()
  const [id, email, senha, tela, pin] = text.split('|')

  if (!id || !email || !senha) {
    return ctx.reply('❌ Use: /estoque ID|Email|Senha|Tela|PIN')
  }

  const produto = db.products.find((p, i) => p.id == id.trim() || String(i + 1) == id.trim())
  if (!produto) return ctx.reply('❌ Produto não encontrado.')

  produto.stock.push({
    email: email.trim(),
    senha: senha.trim(),
    tela: tela ? tela.trim() : 'Acesso único',
    pin: pin ? pin.trim() : 'sem pin'
  })

  saveDB(db)

  ctx.reply(`
✅ ESTOQUE ADICIONADO

📦 Produto: ${produto.name}
📥 Estoque atual: ${produto.stock.length}
`)
})

// 🛒 MEUS PEDIDOS / VENDAS
bot.hears('🛒 Meus Pedidos / Vendas', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  const db = loadDB()
  if (!db.sales.length) return ctx.reply('❌ Nenhuma venda realizada ainda.')

  let texto = '🛒 VENDAS REALIZADAS:\n\n'

  db.sales.forEach((v, i) => {
    texto += `${i + 1}. ${v.product}\n`
    texto += `👤 Cliente: ${v.userId}\n`
    texto += `💰 Valor: ${money(v.price)}\n`
    texto += `📅 Data: ${v.date}\n\n`
  })

  ctx.reply(texto)
})

// 📋 LISTAR PRODUTOS
bot.hears('📋 Listar Produtos', (ctx) => {
const db = loadDB()

if (!db.products || db.products.length === 0) {
return ctx.reply('❌ Nenhum produto cadastrado.')
}

let msg = '📋 LISTA DE PRODUTOS\n\n'

db.products.forEach((p) => {
msg += `🆔 ID: ${p.id}\n`
msg += `📦 Produto: ${p.name}\n`
msg += `💰 Valor: ${money(p.price)}\n`
msg += `📦 Estoque: ${p.stock.length}\n\n`
})

ctx.reply(msg)
})

// ✏️ EDITAR PRODUTO
bot.hears('✏️ Editar Produto', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  ctx.reply(`
✏️ Para editar produto:

/editarproduto ID|Novo Nome|Novo Valor

Exemplo:
/editarproduto 123456|Disney Premium|12
`)
})

bot.command('editarproduto', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  const db = loadDB()
  const text = ctx.message.text.replace('/editarproduto', '').trim()
  const [id, name, priceText] = text.split('|')

  if (!id || !name || !priceText) {
    return ctx.reply('❌ Use: /editarproduto ID|Novo Nome|Novo Valor')
  }

  const produto = db.products.find((p, i) => p.id == id.trim() || String(i + 1) == id.trim())
  if (!produto) return ctx.reply('❌ Produto não encontrado.')

  produto.name = name.trim()
  produto.price = Number(priceText.replace(',', '.'))

  saveDB(db)

  ctx.reply(`✅ Produto editado: ${produto.name}`)
})

// 🗑 REMOVER PRODUTO
bot.hears('🗑 Remover Produto', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  ctx.reply(`
🗑 Para remover produto:

/removerproduto ID
`)
})

bot.command('removerproduto', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  const db = loadDB()
  const id = ctx.message.text.replace('/removerproduto', '').trim()

  const index = db.products.findIndex((p, i) => p.id == id || String(i + 1) == id)
  if (index === -1) return ctx.reply('❌ Produto não encontrado.')

  const removido = db.products.splice(index, 1)[0]
  saveDB(db)

  ctx.reply(`✅ Produto removido: ${removido.name}`)
})

// 💰 ADICIONAR SALDO MANUAL
bot.hears('💰 Adicionar Saldo Manual', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  ctx.reply(`
💰 Para adicionar saldo:

/saldo ID VALOR

Exemplo:
/saldo 123456789 20
`)
})

bot.command('saldo', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  const db = loadDB()
  const partes = ctx.message.text.split(' ')
  const userId = partes[1]
  const valor = Number((partes[2] || '').replace(',', '.'))

  if (!userId || !valor) return ctx.reply('❌ Use: /saldo ID VALOR')

  if (!db.users[userId]) db.users[userId] = { id: userId, balance: 0 }

  db.users[userId].balance += valor
  saveDB(db)

  ctx.reply(`✅ Saldo adicionado: ${money(valor)}`)
})

// 👤 VER CLIENTES
bot.hears('👤 Ver Clientes', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

 const db = loadDB()
  const users = Object.values(db.users)

  if (!users.length) return ctx.reply('❌ Nenhum cliente cadastrado.')

  let texto = '👤 CLIENTES:\n\n'

  users.forEach((u, i) => {
    texto += `${i + 1}. ID: ${u.id}\n`
    texto += `💰 Saldo: ${money(u.balance || 0)}\n\n`
  })

  ctx.reply(texto)
})

// 👥 AFILIADOS
bot.hears('👥 Afiliados', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

 const db = loadDB()

  ctx.reply(`
👥 SISTEMA DE AFILIADOS

👤 Clientes cadastrados: ${Object.keys(db.users).length}
💰 Comissão padrão: 35%
📌 Sistema base ativo.
`)
})

// 📢 ENVIAR AVISO
bot.hears('📢 Enviar Aviso', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  ctx.reply(`
📢 Para enviar aviso:

/aviso Sua mensagem aqui
`)
})

bot.command('aviso', async (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  const db = loadDB()
  const mensagem = ctx.message.text.replace('/aviso', '').trim()

  if (!mensagem) return ctx.reply('❌ Use: /aviso Sua mensagem')

  let enviados = 0

  for (const id of Object.keys(db.users)) {
    try {
      await ctx.telegram.sendMessage(id, `📢 AVISO DA LOJA\n\n${mensagem}`)
      enviados++
    } catch (e) {}
  }

  ctx.reply(`✅ Aviso enviado para ${enviados} cliente(s).`)
})

// 🎁 GIFT CARD
bot.command('resgatar', (ctx) => {
const db = loadDB()

const codigo = ctx.message.text
.replace('/resgatar', '')
.trim()
.toUpperCase()

const gift = db.gifts.find(g => g.code === codigo)

if (!gift) return ctx.reply('❌ Gift Card inválido.')
if (gift.used) return ctx.reply('❌ Esse Gift Card já foi usado.')

const userId = String(ctx.from.id)
if (!db.users[userId]) {
  db.users[userId] = {
    id: userId,
    balance: 0,
    purchases: []
  }
}

db.users[userId].balance = Number(db.users[userId].balance || 0) + Number(gift.value)

gift.used = true
gift.usedBy = userId
gift.usedAt = new Date().toLocaleString('pt-BR')

saveDB(db)

ctx.reply(`
✅ GIFT CARD RESGATADO!

🎁 Código: ${gift.code}
💰 Valor recebido: ${money(gift.value)}
💳 Saldo atual: ${money(db.users[userId].balance)}
`)
})

  bot.command('gift', (ctx) => {
const db = loadDB()

if (!db.gifts) db.gifts = []
if (!db.users) db.users = {}

  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')
  const partes = ctx.message.text.split(' ')
  const codigo = partes[1]?.toUpperCase()
  const valor = Number((partes[2] || '').replace(',', '.'))

  if (!codigo || !valor) return ctx.reply('❌ Use: /gift CODIGO VALOR')

  if (db.gifts.find(g => g.code === codigo)) {
    return ctx.reply('❌ Esse Gift Card já existe.')
  }

  db.gifts.push({
    code: codigo,
    value: valor,
    used: false,
    createdAt: new Date().toLocaleString('pt-BR')
  })

  saveDB(db)

  ctx.reply(`
✅ Gift Card criado!

🎁 Código: ${codigo}
💰 Valor: ${money(valor)}
`)
})
bot.hears(/Gift Card/i, (ctx) => {
if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

const db = loadDB()

if (!db.gifts) db.gifts = []
if (!db.users) db.users = {}

  ctx.reply(`
🎁 Para criar Gift Card:

/gift CODIGO VALOR

Exemplo:
/gift R$50 50

Cliente resgata com:
/resgatar R$50
`)
})
bot.command('resgatar', (ctx) => {
const db = loadDB()

const codigo = ctx.message.text
.replace('/resgatar', '')
.trim()
.toUpperCase()

const gift = db.gifts.find(g => g.code === codigo)

if (!gift) return ctx.reply('❌ Gift Card inválido.')
if (gift.used) return ctx.reply('❌ Esse Gift Card já foi usado.')

const userId = String(ctx.from.id)

if (!db.users[userId]) {
db.users[userId] = {
id: userId,
balance: 0,
purchases: []
}
}

db.users[userId].balance =
Number(db.users[userId].balance || 0) + Number(gift.value)

gift.used = true
gift.usedBy = userId
gift.usedAt = new Date().toLocaleString('pt-BR')

saveDB(db)

ctx.reply(`
✅ GIFT CARD RESGATADO!

🎁 Código: ${gift.code}
💰 Valor recebido: ${money(gift.value)}
💵 Saldo atual: ${money(db.users[userId].balance)}
`)
})

// 📊 ESTATÍSTICAS
bot.hears('📊 Estatísticas', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  const db = loadDB()

  const totalVendido = db.sales.reduce((s, v) => s + Number(v.price || 0), 0)

  ctx.reply(`
📊 ESTATÍSTICAS

📦 Produtos: ${db.products.length}
👤 Clientes: ${Object.keys(db.users).length}
🛒 Vendas: ${db.sales.length}
💰 Total vendido: ${money(totalVendido)}
🎁 Gift Cards: ${db.gifts.length}
`)
})

// ⚙️ CONFIGURAÇÕES
bot.hears('⚙️ Configurações', (ctx) => {
  if (!isAdmin(ctx)) return ctx.reply('❌ Sem permissão.')

  ctx.reply(`
⚙️ CONFIGURAÇÕES

🏪 Loja: RS Streaming
💳 Pagamento: Mercado Pago
🚀 Entrega: Automática
🎁 Gift Card: Ativo
🕒 Suporte: 24h a 48h
`)
})
bot.action('menu_products', async (ctx) => {
  await ctx.answerCbQuery()
  const db = loadDB()
  if (!db.products.length) return ctx.reply('Nenhum produto cadastrado no momento.')

  const buttons = db.products.map(p => [
    Markup.button.callback(`📺 ${p.name} — ${money(p.price)} | Estoque: ${p.stock.length}`, `buy_${p.id}`)
  ])
  buttons.push([Markup.button.callback('⬅️ Voltar', 'back_home')])

  ctx.reply('🛒 Produtos disponíveis:', Markup.inlineKeyboard(buttons))
})

bot.action(/buy_(.+)/, async (ctx) => {
  await ctx.answerCbQuery()

  const db = loadDB()
  const productId = ctx.match[1]
  const user = getUser(db, ctx.from.id)

  const produto = db.products.find(p => p.id === productId)

  if (!produto) {
    return ctx.reply('❌ Produto não encontrado.')
  }

  if (!produto.stock || produto.stock.length === 0) {
    return ctx.reply('❌ Produto sem estoque no momento.')
  }

  if (user.balance < produto.price) {
    return ctx.reply(`
❌ Saldo insuficiente.

💰 Seu saldo: ${money(user.balance)}
📦 Produto: ${produto.name}
💵 Valor: ${money(produto.price)}

Clique em 💰 adicionar saldo para recarregar.
`)
  }

  const entrega = produto.stock.shift()
  user.balance -= produto.price

  if (!db.sales) db.sales = []

  db.sales.push({
    userId: ctx.from.id,
    name: ctx.from.first_name,
    product: produto.name,
    price: produto.price,
    delivery: entrega,
    date: new Date().toLocaleString('pt-BR')
  })

  saveDB(db)

const tela = entrega.tela || 'Acesso único'

const pin = entrega.pin && entrega.pin.toLowerCase() !== 'sem pin'
? `\n⚠️ PIN ${entrega.pin} ⚠️`
: ''

ctx.reply(`
🔰 COMPRA EFETUADA COM SUCESSO 🔰
├🎟 Serviço: ${produto.name}
├💸 Valor: ${money(produto.price)}
└📆 Data Da Compra:
${new Date().toLocaleString('pt-BR')}

ℹ️ DADOS:
├📧 Email: ${entrega.email}
└🔑 Senha: ${entrega.senha}

APENAS 1 DISPOSITIVO

⚠️ ${tela.toUpperCase()} ⚠️${pin}

❌ NÃO CRIE UM PERFIL
❌ SE CRIAR PERFIL PERDE O LOGIN

⚠️ ⏰ •|𝗩𝗔𝗟𝗜𝗗𝗔𝗗𝗘: 30 DIAS ⚠️

⚠️ ATENÇÃO NAS REGRAS ⚠️
❌ ACESSE EM UM DISPOSITIVO SÓ
❌ NÃO MEXA NOS DADOS DA CONTA

‼️ SE FOR IDENTIFICADO MAIS DE UM APARELHO
VOCÊ PERDERÁ LOGIN E SUPORTE

═════❖═════

📞 SUPORTE:
24H a 48H

👥 Grupo suporte:
https://chat.whatsapp.com/IuOQb614sFoEuPW6CNz6wX
`)
})
  
bot.hears('💰 ADICIONAR SALDO', async (ctx) => {

ctx.reply(`
💸 ADICIONAR SALDO 💸

⬇️ Envie apenas o valor que deseja adicionar.

⚠️ Valor mínimo: R$2,00
⚠️ Valor máximo: R$100,00

Exemplos:
5
10
20
50
`)

})

bot.hears(/^\d+([,.]\d{1,2})?$/, async (ctx) => {

const amount = Number(ctx.message.text.replace(',', '.'))

if (amount < 2) {
return ctx.reply('❌ O valor mínimo para adicionar saldo é R$2,00')
}

if (amount > 100) {
return ctx.reply('❌ O valor máximo para adicionar saldo é R$100,00')
}

if (!MP_ACCESS_TOKEN) {
return ctx.reply('⚠️ Mercado Pago ainda não configurado.')
}

try {

const payment = await createPixPayment({
amount,
userId: ctx.from.id,
description: `Saldo RS Streaming - ${ctx.from.id}`
})

const qr = payment.point_of_interaction?.transaction_data

await ctx.reply(`
✅ PIX GERADO!

💰 Valor: R$${amount}

📋 Copia e cola:

${qr?.qr_code || 'Não retornou código PIX'}
`)

} catch (error) {

console.log(error)

ctx.reply('❌ Erro ao gerar PIX.')

}

})

bot.command('check', async (ctx) => {
  const paymentId = ctx.message.text.split(' ')[1]
  if (!paymentId) return ctx.reply('Digite assim: /check ID_DO_PAGAMENTO')
  await checkAndCreditPayment(paymentId, ctx.from.id, ctx)
})

bot.action('menu_my_orders', async (ctx) => {
  await ctx.answerCbQuery()
  const db = loadDB()
  const user = getUser(db, ctx.from.id)
  if (!user.purchases.length) return ctx.reply('Você ainda não tem compras.')

  const text = user.purchases.slice(-10).map(o =>
`📦 ${o.product}
💰 ${money(o.price)}
🔐 ${o.delivered}
📅 ${new Date(o.date).toLocaleString('pt-BR')}`
  ).join('\n\n')
  ctx.reply(`📦 Suas últimas compras:\n\n${text}`)
})

bot.action('menu_support', async (ctx) => {
  await ctx.answerCbQuery()
  ctx.reply('📞 Suporte: chame o ADM no WhatsApp/Telegram.\n\nColoque aqui seu contato oficial.')
})

bot.hears('👤 PERFIL', async (ctx) => {

const db = loadDB()
const user = getUser(db, ctx.from.id)

const username = ctx.from.username
? `@${ctx.from.username}`
: 'Sem username'

ctx.reply(`
✌️ OLÁ, ${ctx.from.first_name}!

Aqui estão os detalhes da sua conta:

👤 DADOS DO USUÁRIO
├ Nome: ${ctx.from.first_name}
├ Username: ${username}
└ ID: ${ctx.from.id}

💰 CARTEIRA
├ Saldo disponível: R$ ${money(user.balance)}
├ Total recarregado (PIX): R$ ${money(user.totalDeposit || 0)}
└ Total gasto em compras: R$ ${money(user.totalSpent || 0)}

📈 RESUMO DE ATIVIDADES
├ Total de compras: ${user.totalBuys || 0}
└ Gifts resgatados: R$ ${money(user.gifts || 0)}

🏆 AFILIADOS
├ Pessoas indicadas: ${user.invites || 0}
└ Seu link:
https://t.me/rsstreaming_bot?start=${ctx.from.id}
`)

})



bot.action('admin_help_add_product', async (ctx) => {
  await ctx.answerCbQuery()
  if (String(ctx.from.id) !== ADMIN_ID) return ctx.reply('❌ Sem permissão.')
  ctx.reply(
`Para adicionar produto, use:

/addproduto nome|valor|estoque1;estoque2;estoque3

Exemplo:
/addproduto HBO Max Premium|12|email1 senha1;email2 senha2`)
})

bot.command('addproduto', (ctx) => {
  if (String(ctx.from.id) !== ADMIN_ID) {
    return ctx.reply('❌ Você não tem permissão.')
  }

  const texto = ctx.message.text.replace('/addproduto ', '')
  const partes = texto.split('|')

  if (partes.length < 3) {
    return ctx.reply(`
❌ Formato errado.

Use assim:
/addproduto Nome do Produto|Preço|estoque1,estoque2

Exemplo:
/addproduto HBO Max Premium|12|email1 senha1,email2 senha2
`)
  }

  const nome = partes[0].trim()
  const preco = Number(partes[1].trim())
  const estoque = partes[2].split(',').map(item => item.trim())

  const db = loadDB()

  db.products.push({
    id: uuidv4(),
    name: nome,
    price: preco,
    stock: estoque
  })

  saveDB(db)

  ctx.reply(`
✅ Produto adicionado com sucesso!

📦 Produto: ${nome}
💰 Valor: R$ ${preco.toFixed(2)}
📊 Estoque: ${estoque.length}
`)
})

function mostrarProdutos(ctx) {
  const db = loadDB()
  const produtos = db.products || []

  if (produtos.length === 0) {
    return ctx.reply('❌ Nenhum produto cadastrado.')
  }

  const botoes = produtos.map((p) => [
    Markup.button.callback(
      `❤️ ${p.name.toUpperCase()} R$${Number(p.price).toFixed(2)} (Qnt: ${p.stock.length})`,
      `produto_${p.id}`
    )
  ])

  botoes.push([Markup.button.callback('🔙 Retornar', 'back_home')])

  ctx.reply(
`Bem-vindo(a)! Escolha uma categoria abaixo para explorar nossos produtos.

👇 Selecione uma opção:`,
    Markup.inlineKeyboard(botoes)
  )
}

bot.hears('🛒 MENU PRINCIPAL', (ctx) => {
  mostrarProdutos(ctx)
})

bot.action(/produto_(.+)/, async (ctx) => {
  await ctx.answerCbQuery()

  const db = loadDB()
  const produto = db.products.find(p => p.id === ctx.match[1])

  if (!produto) {
    return ctx.reply('❌ Produto não encontrado.')
  }

  ctx.reply(
`O MELHOR DO STREAMING EM UM SÓ LUGAR!

🎬 Tenha acesso com entrega rápida e suporte.

💎 Vantagens
🎥 Qualidade Full HD / 4K
🔁 Suporte e substituição garantida
💰 Preços acessíveis

🎁 ${produto.name.toUpperCase()}
🔥 PREÇO: R$${Number(produto.price).toFixed(2)}
📊 ESTOQUE: ${produto.stock.length} UND`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback('🛒 COMPRAR', `buy_${produto.id}`),
        Markup.button.callback('🛒 comprar+1', `buy2_${produto.id}`)
      ],
      [
        Markup.button.callback('ℹ️ Detalhes do Login', `info_${produto.id}`),
        Markup.button.callback('🛒 Add Carrinho', `cart_${produto.id}`)
      ],
      [
        Markup.button.callback('🔙 Retornar', 'voltar_produtos')
      ]
    ])
  )
})

bot.action('voltar_produtos', async (ctx) => {
  await ctx.answerCbQuery()
  mostrarProdutos(ctx)
})
async function createPixPayment({ amount, userId, description }) {
  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': uuidv4()
    },
    body: JSON.stringify({
      transaction_amount: Number(amount),
      description,
      payment_method_id: 'pix',
      payer: {
        email: `cliente${userId}@email.com`
      }
    })
  })

  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

async function getPayment(paymentId) {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${MP_ACCESS_TOKEN}` }
  })
  if (!response.ok) throw new Error(await response.text())
  return response.json()
}

async function checkAndCreditPayment(paymentId, telegramId, ctx = null) {
  const db = loadDB()
  const localPayment = db.payments[paymentId]
  if (!localPayment) {
    if (ctx) await ctx.reply('Pagamento não encontrado no banco local.')
    return
  }
  if (localPayment.status === 'approved') {
    if (ctx) await ctx.reply('Esse pagamento já foi creditado.')
    return
  }

  const payment = await getPayment(paymentId)
  if (payment.status === 'approved') {
    const user = getUser(db, localPayment.userId)
    user.balance += Number(localPayment.amount)
    localPayment.status = 'approved'
    saveDB(db)

    const msg = `✅ Pagamento aprovado!\n💰 Saldo adicionado: ${money(localPayment.amount)}\n💳 Saldo atual: ${money(user.balance)}`
    if (ctx) await ctx.reply(msg, mainMenu())
    else await bot.telegram.sendMessage(localPayment.userId, msg)
  } else {
    if (ctx) await ctx.reply(`⏳ Pagamento ainda está: ${payment.status}`)
  }
}

app.post('/webhook/mercadopago', async (req, res) => {
  try {
    const paymentId = req.body?.data?.id || req.query?.id
    if (paymentId) await checkAndCreditPayment(String(paymentId))
    res.sendStatus(200)
  } catch (e) {
    console.error(e)
    res.sendStatus(200)
  }
})

app.get('/', (req, res) => res.send('Bot RS Streaming online'))

bot.launch()
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
