# Project Guidelines: Pizzería Belgrano Micrositios

## Fast Navigation & Token Optimization Rules
Always use targeted sliced reads (`view_file` with `StartLine` and `EndLine`). Never load full files into context.

## Mandatory Architecture Diagram Maintenance Rule
Whenever any task or implementation alters the system architecture (such as adding/modifying database tables, APIs, storage buckets, frontend modules, hosting configs, or external services), the agent MUST update `ARQUITECTURA.md` with the updated Mermaid diagram and flow map.

### Architecture Map & Line Reference:
- **`PizzeriaBelgrano/js/main.js`**:
  - `L6-56`: State & DOM elements (cart, currentCustomItem, selectors)
  - `L188-219`: Cart drawer toggle & toast notifications
  - `L220-453`: Product Customization Modal (crusts, cheeses, ingredients, notes)
  - `L454-546`: Render Cart UI & quantity updates
  - `L547-607`: WhatsApp Order generation & checkout message formatting
  - `L608-642`: Menu Category filter tabs (toggle Swiper visibility)
  - `L658-790`: Delivery Address checker & distance logic
  - `L791-901`: Dynamic catalog rendering from products DB
  - `L902-994`: Swiper carousels initialization
- **`PizzeriaBelgrano/js/products-db.js`**:
  - `L16-327`: Default base product catalog (Pizzas, Promos, Sándwiches, Fainá, etc.)
  - `L343-494`: Supabase config loading & client initialization
  - `L495-622`: Image upload to Supabase Storage & product CRUD sync
  - `L763-848`: Admin authentication & password change (Local + Supabase)
- **`PizzeriaBelgrano/js/admin-panel.js`**:
  - `L97-371`: Admin topbar & modal injection
  - `L410-492`: Login handler & sync state listeners
  - `L493-573`: Product form modal, image compression & preview
  - `L592-670`: Supabase database connection test & spreadsheet view (Planilla)
  - `L916-1046`: Product save/edit handlers & Supabase sync
- **`PizzeriaBelgrano/js/config.js`**:
  - `L12-16`: Global Supabase credentials (`supabaseUrl`, `supabaseKey`, `storageBucket`)
- **`PizzeriaBelgrano/index.html`**:
  - `L43`: Header & navbar
  - `L92`: Cart drawer container
  - `L143`: Customization modal
  - `L205`: Home / Hero
  - `L253`: Promos section
  - `L382`: Menú section (Carousels)
  - `L1025`: Cobertura / Delivery checker section
