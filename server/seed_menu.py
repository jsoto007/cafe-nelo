"""
Seed menu categories, menu items, and daily specials into the database.

Menu data: sourced from the project's menu.json (the restaurant's full structured menu).
Specials data: sourced from https://tredicisocial.com/specials (live as of March 31, 2026).

Run from the server/ directory:
    python seed_menu.py
"""

import os
import sys
from datetime import datetime

# Ensure the app can be imported
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models import MenuCategory, MenuItem, DailySpecialSection, DailySpecialItem

# ---------------------------------------------------------------------------
# Menu data — full restaurant menu
# ---------------------------------------------------------------------------

MENU = [
    {
        "category": "Appetizers",
        "display_order": 0,
        "items": [
            {
                "name": "Salmon Tar Tar",
                "description": "Sliced sushi grade salmon with diced tomato, cucumber & red onion over avocado & sour cream, topped with micro cilantro & finished with wasabi oil",
                "price_cents": None,
                "tags": ["gf"],
            },
            {
                "name": "Bang Bang Shrimp",
                "description": "Jumbo shrimp sauteed with white wine, gigante beans, extra virgin olive oil, meyer lemon & roasted garlic finished with red pepper flakes",
                "price_cents": None,
                "tags": [],
            },
            {
                "name": '"Inside Out" Meatballs',
                "description": "Beef, pork, & veal meatballs stuffed with fresh mozzarella, ricotta & fontina cheese, panko breaded & fried, topped with homemade crushed plum tomato sauce",
                "price_cents": None,
                "tags": [],
            },
            {
                "name": "Burrata con Prosciutto",
                "description": "Hand-pulled burrata, San Daniele prosciutto, heirloom tomatoes, basil oil, aged balsamic",
                "price_cents": 1800,
                "tags": ["gf"],
            },
            {
                "name": "Polpo alla Griglia",
                "description": "Grilled Spanish octopus, Calabrian chili, white bean purée, pickled celery, smoked paprika oil",
                "price_cents": 2200,
                "tags": ["gf"],
            },
            {
                "name": "Carciofi Fritti",
                "description": "Crispy Roman artichokes, lemon aioli, shaved Parmigiano-Reggiano, fresh herbs",
                "price_cents": 1600,
                "tags": ["v"],
            },
            {
                "name": "Carpaccio di Manzo",
                "description": "Thinly sliced prime beef tenderloin, arugula, capers, lemon, truffle oil, aged pecorino",
                "price_cents": 2000,
                "tags": ["gf"],
            },
            {
                "name": "Baccalà Mantecato",
                "description": "Whipped salt cod, grilled crostini, Taggiasca olives, pickled red onion",
                "price_cents": 1700,
                "tags": [],
            },
        ],
    },
    {
        "category": "Pasta",
        "display_order": 1,
        "items": [
            {
                "name": "Cacio e Pepe",
                "description": "Tonnarelli, Pecorino Romano, Parmigiano-Reggiano, house-cracked black pepper",
                "price_cents": 2600,
                "tags": ["v", "signature"],
            },
            {
                "name": "Tagliatelle al Ragù",
                "description": "Fresh egg tagliatelle, slow-braised Wagyu beef and pork ragù, Parmigiano-Reggiano",
                "price_cents": 3000,
                "tags": ["signature"],
            },
            {
                "name": "Rigatoni all'Amatriciana",
                "description": "Guanciale, San Marzano tomatoes, Pecorino Romano, Calabrian chili",
                "price_cents": 2800,
                "tags": [],
            },
            {
                "name": "Pappardelle ai Funghi",
                "description": "Wild mushroom ragù, truffle butter, thyme, crispy shallots, Grana Padano",
                "price_cents": 2900,
                "tags": ["v"],
            },
            {
                "name": "Ravioli di Ricotta",
                "description": "House-made ricotta and lemon ravioli, brown butter, sage, toasted pine nuts, lemon zest",
                "price_cents": 2700,
                "tags": ["v"],
            },
            {
                "name": "Spaghetti alle Vongole",
                "description": "Littleneck clams, white wine, garlic, Calabrian chili, parsley, breadcrumbs",
                "price_cents": 3200,
                "tags": [],
            },
            {
                "name": "Kobe Beef Ravioli",
                "description": "Homemade ravioli filled with braised kobe beef, caramelized onions, black truffle & fontina di valdosta, in browned butter & thyme finished with natural reduction",
                "price_cents": None,
                "tags": ["signature"],
            },
        ],
    },
    {
        "category": "Entrées",
        "display_order": 2,
        "items": [
            {
                "name": "Free Range Chicken",
                "description": "Half organic chicken prepared scarpiello style, sautéed with sweet cherry peppers, roasted garlic, EVOO, wild mushrooms, fingerling potatoes & crumbled sausage",
                "price_cents": None,
                "tags": ["gf"],
            },
            {
                "name": "Steak Frites",
                "description": "Marinated & grilled prime hanger steak with homemade sour cream-horseradish aioli & natural reduction, finished with crispy garlic & served with hand cut Tuscan fries",
                "price_cents": None,
                "tags": ["gf"],
            },
            {
                "name": "Branzino in Umido",
                "description": "Pan-roasted Mediterranean sea bass, Castelvetrano olive tapenade, cherry tomato confit, caperberries, basil",
                "price_cents": 4200,
                "tags": ["gf"],
            },
            {
                "name": "Costata di Manzo",
                "description": "28-day dry-aged bone-in ribeye (16 oz), rosemary-garlic compound butter, natural jus",
                "price_cents": 6800,
                "tags": ["gf", "signature"],
            },
            {
                "name": "Pollo al Mattone",
                "description": "Brick-pressed Amish chicken, lemon-rosemary jus, wilted escarole, roasted garlic",
                "price_cents": 3800,
                "tags": ["gf"],
            },
            {
                "name": "Agnello in Crosta",
                "description": "Herb-crusted lamb rack, Sardinian fregola, spring pea purée, mint gremolata",
                "price_cents": 5200,
                "tags": [],
            },
        ],
    },
    {
        "category": "Contorni",
        "display_order": 3,
        "items": [
            {
                "name": "Broccolini Aglio e Olio",
                "description": "Sautéed broccolini, garlic, chili flakes, lemon",
                "price_cents": 1100,
                "tags": ["v", "gf"],
            },
            {
                "name": "Patate Arrosto",
                "description": "Crispy roasted fingerling potatoes, rosemary, sea salt, garlic aioli",
                "price_cents": 1000,
                "tags": ["v", "gf"],
            },
            {
                "name": "Insalata di Stagione",
                "description": "Seasonal greens, shaved fennel, radish, citrus vinaigrette",
                "price_cents": 1300,
                "tags": ["v", "gf"],
            },
        ],
    },
    {
        "category": "Dolci",
        "display_order": 4,
        "items": [
            {
                "name": "Tiramisù della Casa",
                "description": "Classic house tiramisù, espresso-soaked ladyfingers, mascarpone, Valrhona cocoa",
                "price_cents": 1400,
                "tags": ["v", "signature"],
            },
            {
                "name": "Panna Cotta",
                "description": "Vanilla bean panna cotta, seasonal fruit compote, candied pistachios",
                "price_cents": 1300,
                "tags": ["v", "gf"],
            },
            {
                "name": "Torta al Cioccolato",
                "description": "Flourless chocolate torte, espresso anglaise, fleur de sel",
                "price_cents": 1500,
                "tags": ["v", "gf"],
            },
            {
                "name": "Selezione di Formaggi",
                "description": "Three Italian cheeses, honeycomb, Marcona almonds, seasonal preserves",
                "price_cents": 2200,
                "tags": ["v", "gf"],
            },
        ],
    },
    {
        "category": "Cocktails",
        "display_order": 5,
        "items": [
            {
                "name": "Tredici Negroni",
                "description": "Gin, Campari, sweet vermouth, charred orange — our house twist on the classic",
                "price_cents": 1600,
                "tags": ["signature"],
            },
            {
                "name": "Aperol Spritz",
                "description": "Aperol, Prosecco, soda water, orange",
                "price_cents": 1400,
                "tags": [],
            },
            {
                "name": "Amalfi Sour",
                "description": "Limoncello, vodka, lemon, egg white, Prosecco float",
                "price_cents": 1600,
                "tags": [],
            },
            {
                "name": "Blood Orange Paloma",
                "description": "Tequila, blood orange juice, grapefruit, agave, salt rim",
                "price_cents": 1500,
                "tags": [],
            },
        ],
    },
    {
        "category": "Wine & Spirits",
        "display_order": 6,
        "items": [
            {
                "name": "Wine by the Glass",
                "description": "A rotating selection of Italian and European wines — ask your server for the current pour list",
                "price_cents": None,
                "tags": [],
            },
            {
                "name": "Curated Bottle List",
                "description": "Our cellar features Barolo, Brunello, Super Tuscans, and estate Prosecco — ask for the full list",
                "price_cents": None,
                "tags": [],
            },
            {
                "name": "Amari & Digestivi",
                "description": "Fernet-Branca, Amaro Montenegro, Averna, Cynar — a proper Italian send-off",
                "price_cents": None,
                "tags": [],
            },
        ],
    },
]

# ---------------------------------------------------------------------------
# Daily specials — sourced from tredicisocial.com/specials
# ---------------------------------------------------------------------------

SPECIALS = [
    {
        "course": "Appetizers",
        "display_order": 0,
        "items": [
            {
                "name": "French Onion Soup",
                "description": "Caramelized onions in beef and brandy broth, with brick oven bread and finished with toasted Gruyère cheese",
                "price_cents": None,
            },
            {
                "name": "Tuna Tartare",
                "description": "Diced sushi grade ahi tuna mixed with soy sauce, avocado, sour cream, jalapeño and mustard seeds, served over crispy rice with black sesame seeds, lemon-lime aioli, topped with micro cilantro and wasabi oil",
                "price_cents": None,
            },
            {
                "name": "Steamed Mussels",
                "description": "PEI mussels steamed with tomato, white wine, roasted garlic, extra virgin olive oil and crumbled hot sausage, served with toasted Tuscan flatbread",
                "price_cents": None,
            },
            {
                "name": "Fried Calamari Agro Dolce",
                "description": "Crispy fried calamari topped with homemade sweet and sour sauce, shaved scallion and black sesame seeds",
                "price_cents": None,
            },
        ],
    },
    {
        "course": "Entrées",
        "display_order": 1,
        "items": [
            {
                "name": "Spicy Chicken Parm",
                "description": "Organic chicken breast, pounded thin, panko breaded and fried, topped with San Marzano crushed plum tomato sauce, a touch of cream, shot of vodka and shaved Calabrian chillis, with toasted mozzarella served over rigatoni",
                "price_cents": None,
            },
            {
                "name": "Orata",
                "description": "Grilled filet of Mediterranean white fish served over roasted sweet creamed corn with Lima beans, charred brussel sprouts and broccoli, finished with lemon chive oil and micro cilantro",
                "price_cents": None,
            },
            {
                "name": "Long Island Duck",
                "description": "Pan seared Long Island duck breast over wild mushroom risotto with caramelized onions and porcini crema finished with frizzled shallots",
                "price_cents": None,
            },
            {
                "name": "Fettuccine",
                "description": "Hand cut fettuccine with braised short rib, oven roasted bone marrow, caramelized onions, wild mushrooms and natural reduction finished with frizzled shallots",
                "price_cents": None,
            },
            {
                "name": "Braised Short Rib",
                "description": "Bone in short rib braised with Chianti, aromatics and natural reduction served with oven roasted Yukon gold potatoes and broccoli rabe finished with frizzled shallots",
                "price_cents": None,
            },
        ],
    },
]


def seed():
    import json

    app = create_app()
    with app.app_context():
        # Clear existing data
        print("Clearing existing menu and specials data...")
        DailySpecialItem.query.delete()
        DailySpecialSection.query.delete()
        MenuItem.query.delete()
        MenuCategory.query.delete()
        db.session.commit()

        # Seed menu
        print("Seeding menu categories and items...")
        for cat_data in MENU:
            cat = MenuCategory(
                name=cat_data["category"],
                display_order=cat_data["display_order"],
                is_visible=True,
            )
            db.session.add(cat)
            db.session.flush()  # get cat.id

            for i, item_data in enumerate(cat_data["items"]):
                item = MenuItem(
                    category_id=cat.id,
                    name=item_data["name"],
                    description=item_data.get("description"),
                    price_cents=item_data.get("price_cents"),
                    tags=json.dumps(item_data.get("tags", [])),
                    display_order=i,
                    is_visible=True,
                )
                db.session.add(item)

            print(f"  ✓ {cat_data['category']} ({len(cat_data['items'])} items)")

        # Seed specials
        print("Seeding daily specials...")
        for sec_data in SPECIALS:
            section = DailySpecialSection(
                course=sec_data["course"],
                display_order=sec_data["display_order"],
                is_visible=True,
            )
            db.session.add(section)
            db.session.flush()

            for i, item_data in enumerate(sec_data["items"]):
                item = DailySpecialItem(
                    section_id=section.id,
                    name=item_data["name"],
                    description=item_data.get("description"),
                    price_cents=item_data.get("price_cents"),
                    display_order=i,
                )
                db.session.add(item)

            print(f"  ✓ {sec_data['course']} ({len(sec_data['items'])} dishes)")

        db.session.commit()
        print("\nDone! Menu and specials seeded successfully.")


if __name__ == "__main__":
    seed()
