const BASE = "http://localhost:3001";

const inventory = [
  { name: "2x4 Pine Studs", category: "lumber", quantity: 120, unit: "pcs", unitCost: 3.50, supplier: "Home Depot", reorderThreshold: 20, notes: "8ft standard studs" },
  { name: "4x4 Cedar Posts", category: "lumber", quantity: 18, unit: "pcs", unitCost: 12.75, supplier: "Lumber Yard Pro", reorderThreshold: 5, notes: "8ft treated, for decks/fences" },
  { name: "3/4 Oak Plywood", category: "lumber", quantity: 8, unit: "sheets", unitCost: 58.00, supplier: "Lumber Yard Pro", reorderThreshold: 4, notes: "4x8 sheets" },
  { name: "1x6 Poplar Boards", category: "lumber", quantity: 35, unit: "pcs", unitCost: 7.25, supplier: "Home Depot", reorderThreshold: 10, notes: "6ft, good for trim and shelving" },
  { name: "Walnut Boards", category: "lumber", quantity: 3, unit: "pcs", unitCost: 45.00, supplier: "Hardwood Direct", reorderThreshold: 5, notes: "1x8x6ft, premium stock" },
  { name: "#8 Wood Screws 2in", category: "fasteners", quantity: 500, unit: "pcs", unitCost: 0.05, supplier: "Home Depot", reorderThreshold: 100, notes: "Phillips head, coarse thread" },
  { name: "3in Deck Screws", category: "fasteners", quantity: 250, unit: "pcs", unitCost: 0.08, supplier: "Home Depot", reorderThreshold: 100, notes: "Star drive, exterior rated" },
  { name: "Brad Nails 18ga", category: "fasteners", quantity: 800, unit: "pcs", unitCost: 0.02, supplier: "Home Depot", reorderThreshold: 200, notes: "1-1/4 inch for trim work" },
  { name: "Cabinet Hinges", category: "hardware", quantity: 24, unit: "pairs", unitCost: 4.50, supplier: "Rockler", reorderThreshold: 6, notes: "Soft-close, overlay" },
  { name: "Drawer Slides 18in", category: "hardware", quantity: 8, unit: "pairs", unitCost: 12.00, supplier: "Rockler", reorderThreshold: 4, notes: "Full extension, ball bearing" },
  { name: "Door Handles - Brushed Nickel", category: "hardware", quantity: 2, unit: "pcs", unitCost: 8.50, supplier: "Rockler", reorderThreshold: 4, notes: "Cabinet pull, 5in" },
  { name: "Titebond III Wood Glue", category: "adhesives", quantity: 3, unit: "bottles", unitCost: 9.00, supplier: "Home Depot", reorderThreshold: 2, notes: "16oz, waterproof" },
  { name: "Minwax Provincial Stain", category: "finishes", quantity: 2, unit: "cans", unitCost: 14.50, supplier: "Home Depot", reorderThreshold: 1, notes: "1 quart" },
  { name: "Polyurethane Satin", category: "finishes", quantity: 1, unit: "cans", unitCost: 18.00, supplier: "Home Depot", reorderThreshold: 2, notes: "1 quart, oil-based" },
];

const projects = [
  { name: "Johnson Kitchen Cabinets", clientName: "Mike Johnson", clientAddress: "142 Oak Street, Springfield", clientPhone: "555-0123", clientEmail: "mike.j@email.com", status: "in_progress", startDate: "2026-01-15", endDate: "2026-03-01", notes: "Full kitchen remodel - 12 cabinets, island with seating. Client wants shaker style in white oak." },
  { name: "Rivera Backyard Deck", clientName: "Sofia Rivera", clientAddress: "88 Maple Ave, Springfield", clientPhone: "555-0456", clientEmail: "s.rivera@email.com", status: "in_progress", startDate: "2026-01-20", endDate: "2026-02-28", notes: "16x20 composite deck with cedar railing. Permit approved." },
  { name: "Thompson Built-in Bookcase", clientName: "David Thompson", clientAddress: "305 Elm Court, Springfield", clientPhone: "555-0789", clientEmail: "dthompson@email.com", status: "planning", startDate: "2026-03-10", endDate: "2026-03-25", notes: "Floor-to-ceiling bookcase for home office. Walnut with adjustable shelves." },
  { name: "Chen Bathroom Vanity", clientName: "Lisa Chen", clientAddress: "12 Birch Lane, Springfield", clientPhone: "555-0321", clientEmail: "lisac@email.com", status: "completed", startDate: "2025-11-01", endDate: "2025-12-15", notes: "Custom double vanity in maple. Completed on schedule." },
  { name: "Park Fence Replacement", clientName: "James Park", clientAddress: "201 Cedar Blvd, Springfield", clientPhone: "555-0654", status: "planning", startDate: "2026-04-01", endDate: "2026-04-15", notes: "Replace 80ft of privacy fence. Cedar boards, 6ft height." },
];

async function seed() {
  console.log("Seeding inventory...");
  for (const item of inventory) {
    const res = await fetch(`${BASE}/api/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    console.log(`  + ${data.name}`);
  }

  console.log("\nSeeding projects...");
  const projectIds = [];
  for (const proj of projects) {
    const res = await fetch(`${BASE}/api/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proj),
    });
    const data = await res.json();
    projectIds.push(data.id);
    console.log(`  + ${data.name} (${data.status})`);
  }

  // Add materials to projects
  console.log("\nAssigning materials to projects...");
  const inv = await (await fetch(`${BASE}/api/inventory`)).json();
  const byName = (n) => inv.find((i) => i.name.includes(n));

  // Kitchen Cabinets project
  const kitchenMats = [
    { item: "Oak Plywood", qty: 6 },
    { item: "Cabinet Hinges", qty: 24 },
    { item: "Drawer Slides", qty: 8 },
    { item: "Door Handles", qty: 12 },
    { item: "Wood Screws", qty: 200 },
    { item: "Titebond", qty: 2 },
    { item: "Polyurethane", qty: 1 },
  ];
  for (const m of kitchenMats) {
    const found = byName(m.item);
    if (found) {
      await fetch(`${BASE}/api/projects/${projectIds[0]}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryItemId: found.id, quantityNeeded: m.qty }),
      });
      console.log(`  Kitchen Cabinets <- ${found.name} x${m.qty}`);
    }
  }

  // Deck project
  const deckMats = [
    { item: "Cedar Posts", qty: 12 },
    { item: "Deck Screws", qty: 500 },
    { item: "2x4 Pine", qty: 40 },
  ];
  for (const m of deckMats) {
    const found = byName(m.item);
    if (found) {
      await fetch(`${BASE}/api/projects/${projectIds[1]}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryItemId: found.id, quantityNeeded: m.qty }),
      });
      console.log(`  Backyard Deck <- ${found.name} x${m.qty}`);
    }
  }

  // Bookcase project
  const bookcaseMats = [
    { item: "Walnut", qty: 8 },
    { item: "Wood Screws", qty: 50 },
    { item: "Titebond", qty: 1 },
    { item: "Provincial Stain", qty: 2 },
  ];
  for (const m of bookcaseMats) {
    const found = byName(m.item);
    if (found) {
      await fetch(`${BASE}/api/projects/${projectIds[2]}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryItemId: found.id, quantityNeeded: m.qty }),
      });
      console.log(`  Bookcase <- ${found.name} x${m.qty}`);
    }
  }

  console.log("\nDone! Refresh your browser.");
}

seed().catch(console.error);
