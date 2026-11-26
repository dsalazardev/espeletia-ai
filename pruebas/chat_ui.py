from playwright.sync_api import sync_playwright
S='/home/claude/shots4'; import os; os.makedirs(S, exist_ok=True)
logs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True)
    for loc, pref in (('es-CO','es'),('en-US','en')):
        ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,locale=loc)
        pg=ctx.new_page(); pg.on('pageerror',lambda e: logs.append(str(e))); pg.on('console',lambda m: logs.append(m.text) if m.type=='error' else None)
        pg.goto('http://localhost:8765/'); pg.wait_for_selector('#tapa-nombre'); pg.fill('#tapa-nombre','Valentina'); pg.click('.tapa-dueno button'); pg.click('#instalar-saltar', timeout=8000); pg.wait_for_timeout(1300)
        pg.click('.muelle [data-vista="chat"]'); pg.wait_for_selector('#chat-sug .chip', timeout=30000)
        pg.screenshot(path=f'{S}/{pref}_1_inicio.png')
        qs = ['me duele la cabeza y estoy mareado','¿puedo llevar a mi perro?','es comestible el frailejón','¿hay wifi en Brisas?','quién ganó el partido'] if pref=='es' else ['can I touch the snow?','what should I bring?','is there a restaurant?']
        for q in qs:
            pg.fill('#chat-in', q); pg.press('#chat-in','Enter'); pg.wait_for_function('window.__ultimoChat && window.__ultimoChat.texto === %r' % q, timeout=15000); pg.wait_for_timeout(350)
            print(pref, q, '->', pg.evaluate('window.__ultimoChat'))
        pg.screenshot(path=f'{S}/{pref}_2_conversacion.png', full_page=True)
        pg.evaluate("document.querySelector('#chat-sug').hidden = false")  # las sugerencias se ocultan al preguntar
        pg.click('.chat-sug .chip >> nth=0'); pg.wait_for_timeout(900); pg.screenshot(path=f'{S}/{pref}_3_chip.png')
        ctx.close()
    b.close()
print(logs or 'sin errores')
