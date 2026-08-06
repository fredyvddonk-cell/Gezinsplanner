# Versie 1.37.2-stap2 – 06-08-2026

## Nieuw
- Boodschappen worden automatisch gegroepeerd per winkel.
- Winkels staan in de vaste volgorde Picnic, Jumbo, Albert Heijn, Lidl, Aldi en Overig.
- Iedere winkelgroep toont het aantal producten.
- Bestaande filters, afvinken, winkel wijzigen en Aankopen verwerken blijven behouden.

## Gewijzigde bestanden
- `index.html`
- `css/style.css`
- `js/shopping.js`
- `CHANGELOG.md`
- `README.md`

## Testen
- Producten van meerdere winkels toevoegen en groepering controleren.
- Winkel wijzigen en controleren dat het product direct naar de juiste groep verhuist.
- Winkel- en prioriteitsfilters testen.
- Afvinken en Aankopen verwerken testen.
- Mobiele weergave en browserconsole controleren.

---

# Versie 1.37.2-stap1 – 06-08-2026

## Nieuw
- Elk voorraadproduct kan een standaardwinkel krijgen.
- Een voorraadproduct dat op de boodschappenlijst komt, gebruikt automatisch deze standaardwinkel.
- Bestaande voorraadproducten krijgen eenmalig Picnic als standaardwinkel.

## Gewijzigde bestanden
- `index.html`
- `js/core.js`
- `js/data.js`
- `js/modals.js`
- `js/stock.js`
- `CHANGELOG.md`

## Testen
- Voorraadproduct wijzigen en standaardwinkel opslaan.
- Product op Aanvullen zetten en winkel op boodschappenlijst controleren.
- Winkel op boodschappenlijst wijzigen en na verversen controleren.
- Geen rode fouten in de console.

---

# Versie 1.37.0c – 06-08-2026

## Opgelost
- Browsercache gebruikt niet langer oude JavaScript-bestanden.
- Alle scripts hebben een versieparameter `?v=1.37.0c`.
- Veilige laadvolgorde ingesteld zodat voorraad- en receptfuncties beschikbaar zijn vóór initialisatie.
- Zichtbaar versienummer bijgewerkt naar `v1.37.0c • Ontwikkeling`.

## Gewijzigde bestanden
- `index.html`
- `CHANGELOG.md`

# Versie 1.37.0b – 06-08-2026

## Opgelost
- BUG-004: losse `save()`, `closeModal()` en `go()`-aanroepen buiten een functie uit `recipes.js` verwijderd.
- Voorkomt dat de app tijdens het laden stopt voordat voorraad- en modal-functies beschikbaar zijn.
- Exact bijgehouden voorraad kan hierdoor weer via **Aanvullen / wijzigen** worden geopend.

## Gewijzigde bestanden
- `js/recipes.js`
- `CHANGELOG.md`

# Versie 1.37.0a – BUG-001

## Opgelost
- Een gekoppeld voorraadproduct staat maximaal één keer op de boodschappenlijst.
- Afvinken van een voorraadproduct maakt niet langer automatisch een tweede regel.
- Bestaande dubbele gekoppelde voorraadregels worden bij opslaan automatisch teruggebracht tot één regel.
- Bij status **Voldoende** worden alle gekoppelde regels van dat voorraadproduct verwijderd.

## Gewijzigde bestanden
- `js/core.js`
- `js/stock.js`
- `CHANGELOG.md`

---

# CHANGELOG

## Versie 1.37.1 – 06-08-2026

### Nieuw
- Knop **Aankopen verwerken** boven de boodschappenlijst.
- Bevestiging voordat afgevinkte boodschappen worden verwerkt.
- Samenvatting na het verwerken.

### Verbeterd
- Afvinken markeert een product alleen als gekocht.
- Voorraad wordt pas bijgewerkt na **Aankopen verwerken**.
- Niet-afgevinkte boodschappen blijven op de lijst staan.
- De standaard boodschappenlijst blijft leeg bij een nieuwe gegevensopslag.
- Gekoppelde exacte voorraad wordt verhoogd met het ingestelde aantal verpakkingen.
- Gekoppelde eenvoudige voorraad wordt op **Voldoende** gezet.

### Gewijzigde bestanden
- `index.html`
- `js/shopping.js`
- `js/core.js`
- `js/data.js`
- `CHANGELOG.md`
- `README.md`

### Testen
- [ ] Knop Aankopen verwerken is zichtbaar.
- [ ] Afvinken verwijdert een boodschap niet direct.
- [ ] Annuleren in de bevestiging verandert niets.
- [ ] Alleen afgevinkte boodschappen worden verwijderd.
- [ ] Niet-afgevinkte boodschappen blijven staan.
- [ ] Voorraad gekoppeld aan een aankoop wordt bijgewerkt.
- [ ] Receptingrediënten worden na verwerken verwijderd.

---

## Versie 1.36 – 06-08-2026

### Nieuw
- Code opgesplitst in losse bestanden (css en js).
- Meerdere maaltijden per dag ondersteund.
- Kookscherm toont meerdere recepten per dag.
- Kookchecklist toegevoegd.
- Voortgangsbalk tijdens het koken.
- Teller "x van y gerechten klaar".

### Verbeterd
- Plannen ondersteunt meerdere maaltijden per dag.
- Weekoverzicht toont alle maaltijden.
- Koken gebruikt dezelfde planning als Plannen.
- Projectstructuur overzichtelijker gemaakt.
- JavaScript-bestanden voorzien van documentatie.

### Opgelost
- Tweede recept op dezelfde dag verdween uit diverse schermen.
- Koken toonde slechts één recept.
- Weergave van meerdere maaltijden is nu overal gelijk.

---

## Ontwikkeling versie 1.37

### Ideeën
- Ingrediënten afvinken tijdens het koken.
- Vanuit ingrediënten direct naar boodschappenlijst.
- Voorraad tonen tijdens het koken.
- Kookvolgorde instellen.
- Timers toevoegen.