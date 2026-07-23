import { afterEach, describe, expect, test } from "bun:test";
import { resolveItems } from "./gear-api";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("boss item details", () => {
  test("resolves item details from the translated JSON API without GraphQL", async () => {
    const requestedUrls: string[] = [];
    globalThis.fetch = async (input) => {
      const url = input.toString();
      requestedUrls.push(url);

      if (url === "https://json.tarkov.dev/regular/items") {
        return Response.json({
          data: {
            items: {
              "json-item": {
                id: "json-item",
                name: "json-item Name",
                shortName: "json-item ShortName",
                iconLink: "https://assets.tarkov.dev/json-item-icon.webp",
                link: "https://tarkov.dev/item/json-item",
                types: ["ammo"],
                properties: {
                  propertiesType: "ItemPropertiesAmmo",
                  caliber: "Caliber9x19PARA",
                  damage: 58,
                  penetrationPower: 14,
                },
              },
            },
          },
        });
      }

      if (url === "https://json.tarkov.dev/regular/items_en") {
        return Response.json({
          data: {
            "json-item Name": "JSON API item",
            "json-item ShortName": "JSON item",
          },
        });
      }

      return new Response(null, { status: 503 });
    };

    const items = await resolveItems(["json-item"], "regular");

    expect(requestedUrls).toEqual([
      "https://json.tarkov.dev/regular/items",
      "https://json.tarkov.dev/regular/items_en",
    ]);
    expect(items["json-item"]).toEqual({
      id: "json-item",
      name: "JSON API item",
      shortName: "JSON item",
      iconLink: "https://assets.tarkov.dev/json-item-icon.webp",
      link: "https://tarkov.dev/item/json-item",
      types: ["ammo"],
      usedInTasks: [],
      armorClass: null,
      ammo: {
        caliber: "Caliber9x19PARA",
        damage: 58,
        penetrationPower: 14,
      },
    });
  });
});
