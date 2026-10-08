// Textos do Patozi em [português, inglês, espanhol]. O idioma é o mesmo do Gamezi e do Topzi (tt:lang).
// {nome} e companhia são trocados pelo valor na hora.

const LANGS = ["pt", "en", "es"];

const PZ_T = {
  "nav.home": ["Início", "Home", "Inicio"],
  "nav.lang": ["Idioma", "Language", "Idioma"],
  "nav.back": ["Voltar para o Gamezi", "Back to Gamezi", "Volver a Gamezi"],
  "nav.settings": ["Configurações", "Settings", "Ajustes"],
  "nav.theme": ["Tema", "Theme", "Tema"],
  "nav.sound": ["Som", "Sound", "Sonido"],
  "home.tag": ["Chute um número. Quem passar da resposta fica com o pato.", "Guess a number. Whoever goes over the answer gets the duck.", "Di un número. Quien se pase de la respuesta se queda con el pato."],
  "home.free": ["Partida", "Game", "Partida"],
  "home.freeSub": ["De 2 a 10 jogadores, com amigos ou o computador", "2 to 10 players, with friends or the computer", "De 2 a 10 jugadores, con amigos o la computadora"],
  "home.online": ["Online", "Online", "Online"],
  "home.onlineSub": ["Cada um no seu celular", "Everyone on their own phone", "Cada uno en su celular"],
  "home.more": ["Mais jogos", "More games", "Más juegos"],
  "account.short": ["Entrar", "Sign in", "Entrar"],
  "daily.name": ["Pato do dia", "Daily duck", "Pato del día"],
  "nav.profile": ["Perfil", "Profile", "Perfil"],
  "nav.dark": ["Usar modo escuro", "Switch to dark mode", "Usar modo oscuro"],
  "nav.light": ["Usar modo claro", "Switch to light mode", "Usar modo claro"],
  "nav.soundOn": ["Som ligado", "Sound on", "Sonido activado"],
  "nav.soundOff": ["Som desligado", "Sound off", "Sonido desactivado"],

  "btn.play": ["Jogar", "Play", "Jugar"],
  "btn.online": ["Jogar online", "Play online", "Jugar online"],
  "btn.back": ["Voltar", "Back", "Volver"],
  "btn.start": ["Começar", "Start", "Empezar"],
  "btn.again": ["Jogar de novo", "Play again", "Jugar otra vez"],
  "btn.home": ["Início", "Home", "Inicio"],
  "btn.close": ["Fechar", "Close", "Cerrar"],
  "btn.share": ["Compartilhar", "Share", "Compartir"],
  "copied": ["Copiado!", "Copied!", "¡Copiado!"],
  "copyPrompt": ["Copie o texto:", "Copy the text:", "Copia el texto:"],

  "home.cards": ["{n} cartas", "{n} cards", "{n} cartas"],
  "foot.terms": ["Termos de uso", "Terms of use", "Términos de uso"],
  "foot.privacy": ["Privacidade", "Privacy", "Privacidad"],
  "foot.gamezi": ["Mais jogos no Gamezi", "More games on Gamezi", "Más juegos en Gamezi"],

  "daily.kicker": ["Pato do dia #{n}", "Daily duck #{n}", "Pato del día #{n}"],
  "daily.done": ["Você fez {pts} de 500 hoje. Volte amanhã!", "You scored {pts} out of 500 today. Come back tomorrow!", "Hiciste {pts} de 500 hoy. ¡Vuelve mañana!"],
  "daily.play": ["Jogar o Pato do dia", "Play the daily duck", "Jugar el pato del día"],
  "daily.see": ["Ver ranking", "See ranking", "Ver ranking"],
  "daily.progress": ["{i} de {n}", "{i} of {n}", "{i} de {n}"],
  "daily.guessPh": ["Seu chute", "Your guess", "Tu número"],
  "daily.send": ["Chutar", "Guess", "Decir"],
  "daily.answer": ["Resposta: {n}", "Answer: {n}", "Respuesta: {n}"],
  "daily.over": ["Passou! Nem a pato.", "Too high! No way, duck.", "¡Te pasaste! Ni de pato."],
  "daily.pts": ["+{n} pontos", "+{n} points", "+{n} puntos"],
  "daily.next": ["Próxima", "Next", "Siguiente"],
  "daily.finish": ["Ver resultado", "See result", "Ver resultado"],
  "daily.total": ["{pts} de 500", "{pts} out of 500", "{pts} de 500"],
  "daily.totalSub": ["Pato do dia #{n}", "Daily duck #{n}", "Pato del día #{n}"],
  "daily.streak": ["Sequência: {n} dias", "Streak: {n} days", "Racha: {n} días"],
  "daily.streak.1": ["Sequência: 1 dia", "Streak: 1 day", "Racha: 1 día"],
  "daily.shareText": ["Patozi · Pato do dia #{n}: {pts}/500\n{linha}\n{url}", "Patozi · Daily duck #{n}: {pts}/500\n{linha}\n{url}", "Patozi · Pato del día #{n}: {pts}/500\n{linha}\n{url}"],
  "daily.position": ["Você ficou em {pos}º de {total} hoje", "You placed #{pos} of {total} today", "Quedaste {pos}.º de {total} hoy"],
  "daily.rankTitle": ["Ranking de hoje", "Today's ranking", "Ranking de hoy"],
  "daily.rankEmpty": ["Ninguém jogou ainda hoje. Seja o primeiro!", "Nobody has played today yet. Be the first!", "Nadie ha jugado hoy todavía. ¡Sé el primero!"],
  "daily.rankOff": ["O ranking aparece quando o modo online está ligado.", "The ranking shows up when online mode is on.", "El ranking aparece cuando el modo online está activo."],
  "daily.rankLoading": ["Carregando o ranking…", "Loading the ranking…", "Cargando el ranking…"],
  "daily.you": ["você", "you", "tú"],

  "setup.title": ["Quem vai jogar?", "Who's playing?", "¿Quién va a jugar?"],
  "setup.sub": ["De 2 a 10 jogadores. Toque no pato para vestir cada um.", "2 to 10 players. Tap a duck to dress it up.", "De 2 a 10 jugadores. Toca el pato para vestir a cada uno."],
  "setup.addHuman": ["+ Pessoa", "+ Person", "+ Persona"],
  "setup.addBot": ["+ Computador", "+ Computer", "+ Computadora"],
  "setup.name": ["Nome", "Name", "Nombre"],
  "setup.you": ["Você", "You", "Tú"],
  "setup.player": ["Jogador {n}", "Player {n}", "Jugador {n}"],
  "setup.bot": ["Computador", "Computer", "Computadora"],
  "setup.botTag": ["computador", "computer", "computadora"],
  "setup.remove": ["Remover", "Remove", "Quitar"],
  "setup.color": ["Trocar cor", "Change color", "Cambiar color"],
  "btn.done": ["Pronto", "Done", "Listo"],
  "setup.dress": ["Vestir o pato", "Dress up the duck", "Vestir el pato"],
  "setup.errMin": ["Precisa de pelo menos 2 jogadores.", "You need at least 2 players.", "Se necesitan al menos 2 jugadores."],
  "setup.errHuman": ["Coloque pelo menos uma pessoa.", "Add at least one person.", "Agrega al menos una persona."],
  "setup.errThemes": ["Escolha pelo menos um tema.", "Pick at least one theme.", "Elige al menos un tema."],
  "opt.title": ["Temas e regras", "Themes and rules", "Temas y reglas"],
  "opt.allThemes": ["Todos os temas", "All themes", "Todos los temas"],
  "opt.nThemes": ["{n} temas", "{n} themes", "{n} temas"],
  "opt.themes": ["Temas", "Themes", "Temas"],
  "opt.all": ["Todos", "All", "Todos"],
  "opt.length": ["Duração", "Length", "Duración"],
  "opt.rapida": ["Rápida", "Quick", "Rápida"],
  "opt.normal": ["Normal", "Normal", "Normal"],
  "opt.longa": ["Longa", "Long", "Larga"],
  "opt.lengthHint": ["Acaba quando alguém juntar {n} cartas.", "Ends when someone has {n} cards.", "Termina cuando alguien junte {n} cartas."],
  "opt.extras": ["Regras extras", "Extra rules", "Reglas extra"],
  "opt.dobrei": ["Dobrei: chutar o dobro ou mais do último chute dá um escudo que tira 1 pato no fim.", "Doubled: guessing double the last guess or more earns a shield that removes 1 duck at the end.", "Doblé: decir el doble o más del último número da un escudo que quita 1 pato al final."],
  "opt.mosca": ["Na mosca: duvidar de um chute exato custa a carta com patos em dobro.", "Bullseye: calling an exact guess costs you the card with double ducks.", "En el blanco: dudar de un número exacto cuesta la carta con patos dobles."],

  "game.quit": ["Sair da partida", "Leave game", "Salir de la partida"],
  "game.quitConfirm": ["Sair da partida? O placar desta partida se perde.", "Leave the game? This game's score will be lost.", "¿Salir de la partida? Se pierde el marcador de esta partida."],
  "game.round": ["Rodada {n} · acaba com {meta} cartas", "Round {n} · ends at {meta} cards", "Ronda {n} · termina con {meta} cartas"],
  "game.ducks": ["{n} patos", "{n} ducks", "{n} patos"],
  "game.ducks.1": ["1 pato", "1 duck", "1 pato"],
  "game.cards": ["{n} cartas", "{n} cards", "{n} cartas"],
  "game.cards.1": ["1 carta", "1 card", "1 carta"],
  "game.noBid": ["Ninguém chutou ainda", "No guesses yet", "Nadie ha dicho un número aún"],
  "game.lastBid": ["Último chute de {nome}", "Last guess by {nome}", "Último número de {nome}"],
  "game.turnOf": ["Vez de {nome}", "{nome}'s turn", "Turno de {nome}"],
  "game.yourTurn": ["Sua vez, {nome}", "Your turn, {nome}", "Tu turno, {nome}"],
  "game.first": ["Abra a rodada com um chute. Qualquer número a partir de 1.", "Open the round with a guess. Any number from 1 up.", "Abre la ronda con un número. Cualquiera desde 1."],
  "game.raise": ["Chute {min} ou mais, ou duvide.", "Guess {min} or more, or call it.", "Di {min} o más, o duda."],
  "game.guessPh": ["Seu chute", "Your guess", "Tu número"],
  "game.guess": ["Chutar", "Guess", "Decir"],
  "game.nemApato": ["Nem a pato!", "No way, duck!", "¡Ni de pato!"],
  "game.thinking": ["{nome} está pensando…", "{nome} is thinking…", "{nome} está pensando…"],
  "game.waiting": ["Esperando {nome} jogar…", "Waiting for {nome}…", "Esperando a {nome}…"],
  "game.errLow": ["O chute precisa ser {min} ou mais.", "The guess must be {min} or more.", "El número debe ser {min} o más."],
  "game.errNum": ["Digite um número inteiro.", "Type a whole number.", "Escribe un número entero."],
  "game.dobrei": ["Dobrei!", "Doubled!", "¡Doblé!"],
  "game.shields": ["{n} escudos", "{n} shields", "{n} escudos"],
  "game.shields.1": ["1 escudo", "1 shield", "1 escudo"],
  "game.called": ["{nome} gritou", "{nome} called", "{nome} gritó"],
  "game.answerIs": ["A resposta é", "The answer is", "La respuesta es"],
  "game.over": ["{valor} passou da resposta. {nome} fica com a carta.", "{valor} is over the answer. {nome} takes the card.", "{valor} se pasó de la respuesta. {nome} se queda la carta."],
  "game.fits": ["{valor} cabe na resposta. {nome} duvidou à toa e fica com a carta.", "{valor} fits under the answer. {nome} called it wrong and takes the card.", "{valor} cabe en la respuesta. {nome} dudó en vano y se queda la carta."],
  "game.bullseye": ["Na mosca! {valor} é exatamente a resposta. {nome} leva a carta com patos em dobro.", "Bullseye! {valor} is exactly right. {nome} takes the card with double ducks.", "¡En el blanco! {valor} es exacto. {nome} se lleva la carta con patos dobles."],
  "game.takes": ["+{n} patos para {nome}", "+{n} ducks for {nome}", "+{n} patos para {nome}"],
  "game.takes.1": ["+1 pato para {nome}", "+1 duck for {nome}", "+1 pato para {nome}"],
  "game.next": ["Próxima carta", "Next card", "Siguiente carta"],
  "game.results": ["Ver resultado", "See result", "Ver resultado"],
  "game.waitHost": ["Esperando o anfitrião seguir…", "Waiting for the host…", "Esperando al anfitrión…"],
  "game.away": ["{nome} saiu. O computador joga por ele.", "{nome} left. The computer plays for them.", "{nome} salió. La computadora juega por él."],

  "res.loser": ["{nome} é o pato!", "{nome} is the duck!", "¡{nome} es el pato!"],
  "res.losers": ["{nomes} são os patos!", "{nomes} are the ducks!", "¡{nomes} son los patos!"],
  "res.sub": ["Mais patos, perdeu. Todo o resto ganhou.", "Most ducks loses. Everyone else wins.", "Más patos, perdió. Todos los demás ganaron."],
  "res.and": [" e ", " and ", " y "],
  "res.duck": ["o pato", "the duck", "el pato"],
  "res.won": ["ganhou", "won", "ganó"],

  "on.title": ["Jogar online", "Play online", "Jugar online"],
  "on.sub": ["Cada um no seu celular. Crie uma sala e mande o código, ou entre na sala de alguém.", "Everyone on their own phone. Create a room and share the code, or join someone's room.", "Cada uno en su celular. Crea una sala y comparte el código, o entra en la sala de alguien."],
  "on.nick": ["Seu nome", "Your name", "Tu nombre"],
  "on.nickPh": ["Como te chamam?", "What do people call you?", "¿Cómo te llaman?"],
  "on.create": ["Criar sala", "Create room", "Crear sala"],
  "on.createSub": ["Você escolhe os temas e começa quando a turma chegar.", "You pick the themes and start when everyone is in.", "Tú eliges los temas y empiezas cuando lleguen todos."],
  "on.createBtn": ["Criar sala", "Create room", "Crear sala"],
  "on.join": ["Entrar numa sala", "Join a room", "Entrar en una sala"],
  "on.joinBtn": ["Entrar", "Join", "Entrar"],
  "on.wait": ["Conectando…", "Connecting…", "Conectando…"],
  "on.errNick": ["Escreva seu nome primeiro.", "Type your name first.", "Escribe tu nombre primero."],
  "on.errCode": ["O código tem 5 letras.", "The code has 5 letters.", "El código tiene 5 letras."],
  "on.errNoRoom": ["Não achei essa sala. Confira o código.", "Couldn't find that room. Check the code.", "No encontré esa sala. Revisa el código."],
  "on.errPlaying": ["Essa sala já está jogando.", "That room is already playing.", "Esa sala ya está jugando."],
  "on.errFull": ["A sala está cheia (máximo de 10).", "The room is full (10 max).", "La sala está llena (máximo 10)."],
  "on.errNet": ["Sem conexão com o servidor. Tente de novo.", "No connection to the server. Try again.", "Sin conexión con el servidor. Inténtalo de nuevo."],
  "on.errAnon": ["Não deu para entrar no modo online. Tente de novo.", "Couldn't start online mode. Try again.", "No se pudo entrar en el modo online. Inténtalo de nuevo."],
  "on.errSetup": ["O modo online ainda não foi configurado neste site.", "Online mode isn't set up on this site yet.", "El modo online aún no está configurado en este sitio."],
  "on.errDb": ["O online do Patozi ainda não foi ativado no banco: falta rodar o supabase/schema.sql no Supabase.", "Patozi online isn't enabled in the database yet: supabase/schema.sql still needs to be run on Supabase.", "El online de Patozi aún no está activado en la base de datos: falta ejecutar supabase/schema.sql en Supabase."],
  "on.closed": ["A sala foi fechada.", "The room was closed.", "La sala se cerró."],
  "on.kicked": ["Você saiu da sala.", "You left the room.", "Saliste de la sala."],
  "lobby.code": ["Código da sala", "Room code", "Código de la sala"],
  "lobby.share": ["Convidar", "Invite", "Invitar"],
  "lobby.shareText": ["Bora jogar Patozi? Entra na minha sala: {url}", "Let's play Patozi! Join my room: {url}", "¿Jugamos Patozi? Entra en mi sala: {url}"],
  "lobby.players": ["Na sala", "In the room", "En la sala"],
  "lobby.host": ["anfitrião", "host", "anfitrión"],
  "lobby.you": ["você", "you", "tú"],
  "lobby.leave": ["Sair da sala", "Leave room", "Salir de la sala"],
  "lobby.kick": ["Tirar da sala", "Remove from room", "Sacar de la sala"],
  "lobby.needTwo": ["Esperando mais gente entrar (mínimo 2).", "Waiting for more people (2 minimum).", "Esperando a más gente (mínimo 2)."],
  "lobby.ready": ["Tudo pronto. Comece quando quiser.", "All set. Start whenever you want.", "Todo listo. Empieza cuando quieras."],
  "lobby.waitHost": ["Esperando {nome} começar a partida.", "Waiting for {nome} to start the game.", "Esperando a que {nome} empiece la partida."],
  "lobby.settings": ["Temas: {temas} · {duracao}", "Themes: {temas} · {duracao}", "Temas: {temas} · {duracao}"],

  "profile.title": ["Perfil", "Profile", "Perfil"],
  "stats.games": ["partidas", "games", "partidas"],
  "stats.wins": ["escapou do pato", "dodged the duck", "se salvó del pato"],
  "stats.losses": ["vezes o pato", "times the duck", "veces el pato"],
  "stats.calls": ["\"nem a pato\" certeiros", "correct calls", "\"ni de pato\" acertados"],
  "stats.ducks": ["patos recebidos", "ducks taken", "patos recibidos"],
  "stats.doubled": ["dobreis", "doubles", "doblés"],
  "stats.daily": ["dias de Pato do dia", "daily ducks played", "días de pato del día"],
  "stats.best": ["melhor Pato do dia", "best daily duck", "mejor pato del día"],
  "account.enter": ["Entrar na conta Gamezi", "Sign in to Gamezi", "Entrar a Gamezi"],
  "account.mine": ["Minha conta", "My account", "Mi cuenta"],
  "account.pitch": ["Com a conta Gamezi (a mesma de todos os jogos), suas estatísticas ficam salvas e vão com você para outro celular.", "With your Gamezi account (the same for every game), your stats are saved and follow you to other phones.", "Con la cuenta Gamezi (la misma de todos los juegos), tus estadísticas quedan guardadas y te siguen a otro celular."],
  "account.connected": ["Conta Gamezi: {email}. Suas estatísticas ficam salvas na conta.", "Gamezi account: {email}. Your stats are saved to your account.", "Cuenta Gamezi: {email}. Tus estadísticas se guardan en la cuenta."],
  "account.needSetup": ["O modo online ainda não foi configurado neste site.", "Online mode isn't set up on this site yet.", "El modo online aún no está configurado en este sitio."],

  "closet.title": ["Vista seu pato", "Dress up your duck", "Viste a tu pato"],
  "closet.sub": ["Seu visual aparece nas partidas, no resultado e na sala online.", "Your look shows up in games, results and online rooms.", "Tu look aparece en las partidas, en el resultado y en la sala online."],
  "closet.color": ["Cor", "Color", "Color"],
  "closet.colorN": ["Cor {n}", "Color {n}", "Color {n}"],
  "closet.none": ["Nada", "None", "Nada"],
  "closet.random": ["Sortear visual", "Random look", "Look al azar"],
  "closet.clear": ["Tirar tudo", "Remove all", "Quitar todo"],
  "closet.of": ["Pato de {nome}", "{nome}'s duck", "Pato de {nome}"],
  "suggest.title": ["Mande uma carta", "Send us a card", "Envíanos una carta"],
  "suggest.sub": ["Tem uma pergunta boa com resposta em número (ex.: \"Quantos ossos tem o pé humano?\")? Mande para a gente. As melhores entram no jogo.", "Got a good question with a number for an answer (e.g. \"How many bones are in the human foot?\")? Send it in. The best ones make it into the game.", "¿Tienes una buena pregunta con respuesta numérica (ej.: \"¿Cuántos huesos tiene el pie humano?\")? Envíala. Las mejores entran en el juego."],
  "suggest.q": ["Sua pergunta", "Your question", "Tu pregunta"],
  "suggest.a": ["Resposta", "Answer", "Respuesta"],
  "suggest.src": ["Fonte (opcional)", "Source (optional)", "Fuente (opcional)"],
  "suggest.theme": ["Tema da carta", "Card theme", "Tema de la carta"],
  "suggest.otherTheme": ["Outro tema", "Other theme", "Otro tema"],
  "suggest.send": ["Enviar carta", "Send card", "Enviar carta"],
  "suggest.ok": ["Valeu! Sua carta chegou.", "Thanks! Your card was sent.", "¡Gracias! Tu carta llegó."],
  "suggest.err": ["Escreva a pergunta e a resposta em número.", "Write the question and a numeric answer.", "Escribe la pregunta y la respuesta en número."],

  "help.title": ["Como jogar", "How to play", "Cómo jugar"],
  "help.html": [
    `<p>Uma carta, uma pergunta com resposta em número. Ninguém sabe a resposta: o jogo é chutar sem passar dela.</p>
     <ol class="help-steps">
       <li><b>Chute.</b> Na sua vez, diga um número <b>maior</b> que o último chute.</li>
       <li><b>Ou duvide.</b> Achou que o último chute já passou da resposta? Grite <b>"Nem a pato!"</b>.</li>
       <li><b>Revela.</b> Se o chute passou da resposta, quem chutou fica com a carta. Se não passou, quem duvidou fica com ela.</li>
       <li><b>Patos.</b> Cada carta tem de 1 a 3 patos. Quem ficou com a carta começa a próxima rodada.</li>
       <li><b>Fim.</b> Quando alguém junta as cartas da meta, acaba. Quem tiver <b>mais patos perde</b>; todo o resto ganha.</li>
     </ol>
     <p class="help-example">Exemplo: "Quantos ossos tem o corpo humano adulto?" Ana chuta 150, Beto sobe para 200, Caio grita <b>Nem a pato!</b> A resposta é 206: 200 cabia, então Caio fica com a carta.</p>
     <h3>Regras extras</h3>
     <p><b>Dobrei:</b> chutou o dobro (ou mais) do chute anterior? Ganha um escudo que tira 1 pato no fim.<br><b>Na mosca:</b> duvidou de um chute exato? A carta vem com patos em dobro.</p>
     <h3>Pato do dia</h3>
     <p>Todo dia, as mesmas 5 perguntas para todo mundo. Chegue o mais perto possível sem passar: até 100 pontos por pergunta.</p>`,
    `<p>One card, one question with a number for an answer. Nobody knows it: the game is guessing without going over.</p>
     <ol class="help-steps">
       <li><b>Guess.</b> On your turn, say a number <b>higher</b> than the last guess.</li>
       <li><b>Or call it.</b> Think the last guess already went past the answer? Shout <b>"No way, duck!"</b>.</li>
       <li><b>Reveal.</b> If the guess went over, whoever guessed takes the card. If not, whoever called it takes the card.</li>
       <li><b>Ducks.</b> Each card has 1 to 3 ducks. Whoever took the card starts the next round.</li>
       <li><b>End.</b> When someone reaches the card goal, the game ends. <b>Most ducks loses</b>; everyone else wins.</li>
     </ol>
     <p class="help-example">Example: "How many bones are in the adult human body?" Ana guesses 150, Ben raises to 200, Cal shouts <b>No way, duck!</b> The answer is 206: 200 fit, so Cal takes the card.</p>
     <h3>Extra rules</h3>
     <p><b>Doubled:</b> guessed double (or more) the previous guess? You earn a shield that removes 1 duck at the end.<br><b>Bullseye:</b> called an exact guess? The card comes with double ducks.</p>
     <h3>Daily duck</h3>
     <p>Every day, the same 5 questions for everyone. Get as close as you can without going over: up to 100 points per question.</p>`,
    `<p>Una carta, una pregunta con respuesta numérica. Nadie sabe la respuesta: el juego es acercarse sin pasarse.</p>
     <ol class="help-steps">
       <li><b>Di un número.</b> En tu turno, di un número <b>mayor</b> que el último.</li>
       <li><b>O duda.</b> ¿Crees que el último ya se pasó de la respuesta? Grita <b>"¡Ni de pato!"</b>.</li>
       <li><b>Se revela.</b> Si el número se pasó, quien lo dijo se queda la carta. Si no, se la queda quien dudó.</li>
       <li><b>Patos.</b> Cada carta tiene de 1 a 3 patos. Quien se quedó la carta empieza la siguiente ronda.</li>
       <li><b>Final.</b> Cuando alguien junta las cartas de la meta, termina. Quien tenga <b>más patos pierde</b>; todos los demás ganan.</li>
     </ol>
     <p class="help-example">Ejemplo: "¿Cuántos huesos tiene el cuerpo humano adulto?" Ana dice 150, Beto sube a 200, Caio grita <b>¡Ni de pato!</b> La respuesta es 206: 200 cabía, así que Caio se queda la carta.</p>
     <h3>Reglas extra</h3>
     <p><b>Doblé:</b> ¿dijiste el doble (o más) del número anterior? Ganas un escudo que quita 1 pato al final.<br><b>En el blanco:</b> ¿dudaste de un número exacto? La carta viene con patos dobles.</p>
     <h3>Pato del día</h3>
     <p>Cada día, las mismas 5 preguntas para todos. Acércate lo más posible sin pasarte: hasta 100 puntos por pregunta.</p>`,
  ],
};

let lang = (() => {
  let l = null;
  try { l = JSON.parse(localStorage.getItem("tt:lang")); } catch (e) { /* sem armazenamento */ }
  if (LANGS.includes(l)) return l;
  const nav = (typeof navigator !== "undefined" && navigator.language || "pt").slice(0, 2);
  return LANGS.includes(nav) ? nav : "pt";
})();

// Com número: usa a forma "key.1" quando n é 1 (1 pato, 2 patos).
function tn(key, n, vars = {}) {
  return t(n === 1 && PZ_T[key + ".1"] ? key + ".1" : key, { n: fmt(n), ...vars });
}

function t(key, vars) {
  const row = PZ_T[key];
  let s = row ? row[LANGS.indexOf(lang)] : key;
  if (vars) Object.entries(vars).forEach(([k, v]) => (s = s.split(`{${k}}`).join(v)));
  return s;
}

// Texto de uma lista [pt, en, es] (temas e cartas).
function tr(arr) {
  return arr[LANGS.indexOf(lang)] || arr[0];
}

function applyI18n(root = document) {
  document.documentElement.lang = { pt: "pt-BR", en: "en", es: "es" }[lang];
  root.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  root.querySelectorAll("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
    el.title = t(el.dataset.i18nAria);
  });
}

function fmt(n, ano) {
  if (ano) return String(n);
  return new Intl.NumberFormat({ pt: "pt-BR", en: "en-US", es: "es-ES" }[lang], { maximumFractionDigits: 0, useGrouping: n >= 10000 || lang !== "es" }).format(n);
}
