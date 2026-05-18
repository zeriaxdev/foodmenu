# Wilma Plus Food Menu API
This API provides additional food menus which are not available as JSON.
This middleware parses HTML or PDF and then converts them to JSON format.

### Current list of supported menus
- Asikkala ([https://www.asikkala.fi/koulujen-ruokalista/](https://www.asikkala.fi/koulujen-ruokalista/))
- Kastelli ([https://ravintolapalvelut.iss.fi/kastelli](https://ravintolapalvelut.iss.fi/kastelli))
- Mäntälän koulut ([https://mantsala.ravintolapalvelut.iss.fi/mantsalan-koulu](https://mantsala.ravintolapalvelut.iss.fi/mantsalan-koulu))
- Kanresta: Tampere-Pirkkala lentoasema ([https://www.kanresta.fi/ravintola/tampere-pirkkala-lentoasema/](https://www.kanresta.fi/ravintola/tampere-pirkkala-lentoasema/))
- AEL ([https://ravintolapalvelut.iss.fi/ael](https://ravintolapalvelut.iss.fi/ael))
- Loviisa ([https://www.loviisa.fi/paivahoito-ja-koulutus/kouluruokailu/](https://www.loviisa.fi/paivahoito-ja-koulutus/kouluruokailu/))
- Pyhtää ([https://pyhtaa.fi/fi/lounaslista-koulut](https://pyhtaa.fi/fi/lounaslista-koulut))
- Pöytyä Peruskoulu ([https://www.poytya.fi/varhaiskasvatus-ja-koulutus/perusopetus/koulujen-yhteiset-tiedot/ruokalistat/](https://www.poytya.fi/varhaiskasvatus-ja-koulutus/perusopetus/koulujen-yhteiset-tiedot/ruokalistat/))
- Tampereen Steinerkoulu ([https://www.tampereensteinerkoulu.fi/luomuravintola-timjami/ruokalista/](https://www.tampereensteinerkoulu.fi/luomuravintola-timjami/ruokalista/))
- Kauhajoki ([https://calendar.google.com/calendar/ical/ruokalista@opinnet.fi/public/basic.ics](https://calendar.google.com/calendar/ical/ruokalista@opinnet.fi/public/basic.ics))
- Looki ([https://looki.fi/](https://looki.fi/))
- SYK ([https://syk.fi/](https://syk.fi/))
- TYK ([https://www.tyk.fi/yhteiskoulu/tietoa/ruokala/](https://www.tyk.fi/yhteiskoulu/tietoa/ruokala/))
- MAYK ([https://www.mayk.fi/tietoa-meista/ruokailu/](https://www.mayk.fi/tietoa-meista/ruokailu/))
- PHYK ([https://www.phyk.fi/ruokalista/](https://www.phyk.fi/ruokalista/))
- Any Aromi V2 (aka. Aromi SaaS)

### Documentation
Read the [wiki](https://github.com/wilmaplus/foodmenu/wiki)

### MCP server
An [MCP](https://modelcontextprotocol.io) server (`foodmenu-mcp`) exposes each
menu endpoint as a tool over stdio, so AI assistants can query menus directly.

Build and run alongside the HTTP API:

```bash
npm install
npm start            # starts the HTTP API on PORT (default 3001)
npm run mcp          # builds and starts the MCP server (stdio)
```

The MCP server forwards calls to the HTTP API at `FOODMENU_API_URL`
(default `http://localhost:3001`). After publishing, it is also available
as the `foodmenu-mcp` binary.
