const test = require("node:test");
const assert = require("node:assert/strict");

test("resource category filters and tags use localized labels", async () => {
  const { buildResourceCategories } = await import(
    "../src/lib/resourceCategories.ts"
  );

  const articles = [
    {
      slug: "plan-comptable-suisse-pme-tendances-2026",
      title: "Swiss chart of accounts",
      description: "Accounting guide",
    },
    {
      slug: "controle-tva-suisse-pme",
      title: "VAT audit",
      description: "Tax guide",
    },
  ];

  const categories = buildResourceCategories(articles, {
    all: "All",
    accounting: "Accounting",
    tax: "Tax",
    payroll: "Payroll",
    corporate: "Corporate",
    international: "International",
    digital: "Digital",
  });

  assert.deepEqual(
    categories.items.map((category) => category.label),
    ["Accounting", "Tax"],
  );
  assert.equal(categories.bySlug["controle-tva-suisse-pme"], "tax");
});
