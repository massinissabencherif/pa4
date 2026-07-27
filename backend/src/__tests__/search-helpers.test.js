import { describe, it, expect } from "vitest";
import { buildTsQuery, buildTsQueryAny, seriesKey, diversifyBySeries } from "../lib/search.js";

describe("buildTsQuery", () => {
  it("découpe en tokens préfixés reliés par AND", () => {
    expect(buildTsQuery("dark knight")).toBe("dark:* & knight:*");
  });

  it("ignore la ponctuation et les caractères non alphanumériques", () => {
    expect(buildTsQuery("Batman: R.I.P.!")).toBe("batman:* & r:* & i:* & p:*");
  });

  it("conserve les lettres accentuées", () => {
    expect(buildTsQuery("Astérix")).toBe("astérix:*");
  });

  it("renvoie null sur une saisie vide ou sans token", () => {
    expect(buildTsQuery("")).toBeNull();
    expect(buildTsQuery("   ")).toBeNull();
    expect(buildTsQuery("!!!")).toBeNull();
    expect(buildTsQuery(null)).toBeNull();
  });
});

describe("buildTsQueryAny", () => {
  // Plusieurs sujets sont indépendants : exiger qu'un même comic contienne
  // « Superman » ET « Gotham » ne renverrait rien. Il faut un OU.
  it("relie plusieurs sujets par OU, chacun parenthésé", () => {
    expect(buildTsQueryAny(["Superman", "dark knight"])).toBe("(superman:*) | (dark:* & knight:*)");
  });

  it("écarte les sujets sans token exploitable", () => {
    expect(buildTsQueryAny(["Superman", "!!!", ""])).toBe("(superman:*)");
  });

  it("renvoie null quand aucun sujet n'est exploitable", () => {
    expect(buildTsQueryAny([])).toBeNull();
    expect(buildTsQueryAny(["", "??"])).toBeNull();
    expect(buildTsQueryAny(undefined)).toBeNull();
  });
});

describe("seriesKey", () => {
  it("retire le numéro et le sous-titre d'un épisode", () => {
    expect(seriesKey("Batgirl #9 : The Three Swords, Part 1")).toBe("batgirl");
    expect(seriesKey("Harley Quinn #52 : Weakness Is the Brand")).toBe("harley quinn");
  });

  it("retire une année entre parenthèses", () => {
    expect(seriesKey("The Spectacular Spider-Man #4 (1976)")).toBe("the spectacular spider-man");
    expect(seriesKey("Superman - Spider-Man (2026)")).toBe("superman - spider-man");
  });

  it("laisse intact un titre unique", () => {
    expect(seriesKey("Watchmen")).toBe("watchmen");
    expect(seriesKey("V for Vendetta")).toBe("v for vendetta");
  });

  it("regroupe bien les numéros d'une même série", () => {
    const keys = [
      "Batgirl #9 : The Three Swords, Part 1",
      "Batgirl #10 : The Three Swords, Part 2",
      "Batgirl #21 : Forget-Me-Not Part 2 of 3",
    ].map(seriesKey);
    expect(new Set(keys).size).toBe(1);
  });
});

describe("diversifyBySeries", () => {
  const comic = (title) => ({ title });

  // C'est le cœur du correctif : le tri renvoyait 13 numéros consécutifs de Batgirl,
  // un jeu de candidats inutilisable pour recommander quoi que ce soit.
  it("plafonne le nombre d'entrées par série", () => {
    const input = [
      comic("Batgirl #9 : A"),
      comic("Batgirl #10 : B"),
      comic("Batgirl #11 : C"),
      comic("Batgirl #12 : D"),
      comic("Watchmen"),
    ];
    const out = diversifyBySeries(input, 2);
    expect(out.map((c) => c.title)).toEqual(["Batgirl #9 : A", "Batgirl #10 : B", "Watchmen"]);
  });

  it("conserve l'ordre d'entrée (la pertinence est déjà encodée dedans)", () => {
    const input = [comic("Watchmen"), comic("Batgirl #9 : A"), comic("V for Vendetta")];
    expect(diversifyBySeries(input, 1).map((c) => c.title)).toEqual([
      "Watchmen",
      "Batgirl #9 : A",
      "V for Vendetta",
    ]);
  });

  it("ne retire rien quand toutes les séries sont distinctes", () => {
    const input = [comic("Watchmen"), comic("Akira, Vol. 1"), comic("Persepolis")];
    expect(diversifyBySeries(input, 2)).toHaveLength(3);
  });

  it("accepte une liste vide", () => {
    expect(diversifyBySeries([], 2)).toEqual([]);
  });
});
