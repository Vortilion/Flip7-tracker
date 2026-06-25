import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { X, RefreshCw, Shuffle, Hand, Layers } from "lucide-react";

/* ---------- Utilities ---------- */
const numberCards = Array.from({ length: 12 }, (_, i) => String(i + 1));
const specialCards = [
  "+2",
  "+4",
  "+6",
  "+8",
  "+10",
  "x2",
  "freeze",
  "flip three",
  "second chance",
];
const allCards = ["0", ...numberCards, ...specialCards];

export function sortedHandAfterAdd(hand, card) {
  const newHand = [...hand, card];
  const numeric = newHand
    .filter((c) => numberCards.includes(c))
    .map((c) => Number(c))
    .sort((a, b) => a - b)
    .map((n) => String(n));
  const others = newHand.filter((c) => !numberCards.includes(c));
  return [...others, ...numeric];
}

function makeInitialDeck() {
  const base = { 0: 1 };
  numberCards.forEach((n, i) => {
    base[n] = i + 1;
  });
  const specials = {
    "+2": 1,
    "+4": 1,
    "+6": 1,
    "+8": 1,
    "+10": 1,
    x2: 1,
    freeze: 3,
    "flip three": 3,
    "second chance": 3,
  };
  return { ...base, ...specials };
}
function sum(obj) {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}

const LS_KEY = "flip7-tracker-state-v1";

/* ---------- App ---------- */
export default function Flip7App() {
  const [deck, setDeck] = useState(makeInitialDeck);
  const [hand, setHand] = useState([]);
  const [sortByProb, setSortByProb] = useState(true);
  const [history, setHistory] = useState([]);

  // Load state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.deck) setDeck(parsed.deck);
        if (parsed.hand) setHand(parsed.hand);
        if (typeof parsed.sortByProb === "boolean")
          setSortByProb(parsed.sortByProb);
        if (Array.isArray(parsed.history)) setHistory(parsed.history);
      }
    } catch {}
  }, []);

  // Save state
  useEffect(() => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ deck, hand, sortByProb, history }),
    );
  }, [deck, hand, sortByProb, history]);

  const totalInitial = useMemo(() => sum(makeInitialDeck()), []);
  const totalLeft = useMemo(() => sum(deck), [deck]);

  const stats = useMemo(() => {
    const rows = allCards.map((c) => ({
      card: c,
      left: deck[c] || 0,
      prob: totalLeft > 0 ? ((deck[c] || 0) / totalLeft) * 100 : 0,
    }));
    return sortByProb
      ? rows.sort((a, b) => b.prob - a.prob)
      : rows.sort(
          (a, b) => allCards.indexOf(a.card) - allCards.indexOf(b.card),
        );
  }, [deck, totalLeft, sortByProb]);

  const numericStats = useMemo(
    () => stats.filter((s) => numberCards.includes(s.card)),
    [stats],
  );
  const top5 = useMemo(() => numericStats.slice(0, 5), [numericStats]);

  const dangerProb = useMemo(() => {
    const uniques = hand.filter(
      (c, i, arr) => arr.indexOf(c) === arr.lastIndexOf(c),
    );
    return numericStats
      .filter((s) => uniques.includes(s.card))
      .reduce((acc, s) => acc + s.prob, 0);
  }, [hand, numericStats]);

  const recommendation = useMemo(
    () =>
      dangerProb > 20
        ? { level: "warn", text: "Better pass" }
        : { level: "ok", text: "You can draw" },
    [dangerProb],
  );

  // Actions
  const playCard = (card) => {
    if ((deck[card] || 0) > 0) {
      setDeck((d) => ({ ...d, [card]: d[card] - 1 }));
      setHistory((h) => [{ type: "played", card }, ...h]);
    }
  };
  const addToHand = (card) => {
    if ((deck[card] || 0) > 0) {
      setDeck((d) => ({ ...d, [card]: d[card] - 1 }));
      setHand((h) => sortedHandAfterAdd(h, card));
      setHistory((h) => [{ type: "hand", card }, ...h]);
    }
  };
  const removeFromHand = (idx) => {
    setHand((h) => h.filter((_, i) => i !== idx));
  };
  const returnHandToDeck = () => {
    const counts = {};
    hand.forEach((c) => {
      counts[c] = (counts[c] || 0) + 1;
    });
    setDeck((d) => {
      const nd = { ...d };
      Object.entries(counts).forEach(([c, k]) => {
        nd[c] = (nd[c] || 0) + k;
      });
      return nd;
    });
    setHand([]);
  };
  const clearHand = () => setHand([]);
  const resetAll = () => {
    setDeck(makeInitialDeck());
    setHand([]);
    setSortByProb(true);
    setHistory([]);
  };
  const undo = () => {
    const last = history[0];
    if (!last) return;
    setHistory((h) => h.slice(1));
    if (last.type === "played") {
      setDeck((d) => ({ ...d, [last.card]: (d[last.card] || 0) + 1 }));
    } else if (last.type === "hand") {
      let removed = false;
      setHand((h) => {
        const copy = [...h];
        const idx = copy.findIndex((c) => !removed && c === last.card);
        if (idx !== -1) {
          copy.splice(idx, 1);
          removed = true;
        }
        return copy;
      });
      setDeck((d) => ({ ...d, [last.card]: (d[last.card] || 0) + 1 }));
    }
  };

  function CardPill({ label, onPlay, onHand, left }) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition px-3 py-2 gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-2 py-1 rounded-xl">
            {label}
          </Badge>
          <span className="text-xs text-slate-600">{left} left</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onPlay}
            className="rounded-xl border-slate-300"
          >
            <Layers className="h-4 w-4 mr-1" />
            Played
          </Button>
          <Button size="sm" onClick={onHand} className="rounded-xl">
            <Hand className="h-4 w-4 mr-1" />
            To hand
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Tabs with Undo + Reset inline */}
        <Tabs defaultValue="play" className="space-y-6">
          <div className="flex items-center justify-end">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-xl border-slate-300 bg-white"
                onClick={undo}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Undo
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-slate-300 bg-white"
                onClick={resetAll}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          {/* Play Tab */}
          <TabsContent
            value="play"
            className="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-6-y-6"
          >
            <div className="grid md:grid-cols-5 gap-6">
              {/* Left: Deck */}
              <div className="md:col-span-3 space-y-6">
                <Card className="rounded-xl border-slate-200 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Deck</span>
                      <div className="text-sm text-slate-600">
                        Left {totalLeft} / {totalInitial}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress
                      value={(totalLeft / totalInitial) * 100}
                      className="h-2 rounded-full mb-4"
                    />
                    <ScrollArea className="pr-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {allCards.map((c) => (
                          <CardPill
                            key={c}
                            label={c}
                            left={deck[c]}
                            onPlay={() => playCard(c)}
                            onHand={() => addToHand(c)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Assistant */}
              <div className="md:col-span-2 space-y-6">
                <Card className="rounded-xl border-slate-200 bg-white">
                  <CardHeader>
                    <CardTitle>Your Hand</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hand.length === 0 ? (
                      <p className="text-sm text-slate-600">
                        No cards in hand.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {hand.map((c, i) => (
                          <Badge
                            key={`${c}-${i}`}
                            className="rounded-xl text-sm flex items-center gap-2"
                          >
                            {c}
                            <button
                              onClick={() => removeFromHand(i)}
                              aria-label="Remove from hand"
                              className="opacity-70 hover:opacity-100"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="rounded-xl border-slate-300 bg-white"
                        onClick={clearHand}
                      >
                        Clear hand
                      </Button>
                      <Button className="rounded-xl" onClick={returnHandToDeck}>
                        Return cards
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-slate-200 bg-white">
                  <CardHeader>
                    <CardTitle>Top draw chances</CardTitle>
                    <p>Calculated from current deck composition.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {top5.length === 0 ? (
                        <p className="text-sm text-slate-600">
                          No numeric cards left in the deck.
                        </p>
                      ) : (
                        <ul className="text-sm list-disc pl-5">
                          {top5.map((s) => (
                            <li key={s.card}>
                              {s.card}: {s.prob.toFixed(2)}%
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="pt-2 text-sm">
                        Chance to hit a second identical (uniques in hand):{" "}
                        <strong>{dangerProb.toFixed(2)}%</strong>
                      </div>
                      <div
                        className={
                          recommendation.level === "warn"
                            ? "text-red-600"
                            : "text-emerald-700"
                        }
                      >
                        {recommendation.text}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-xl border-slate-200 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Decision Assistant</span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="sort-prob"
                        checked={sortByProb}
                        onCheckedChange={setSortByProb}
                      />
                      <label htmlFor="sort-prob" className="text-sm">
                        Sort by probability
                      </label>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden">
                      <Table className="[&>tbody>tr:nth-child(even)]:bg-slate-50">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Card</TableHead>
                            <TableHead>Left</TableHead>
                            <TableHead>Chance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.map((s) => (
                            <TableRow key={s.card}>
                              <TableCell className="font-medium">
                                {s.card}
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {s.left}
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {s.prob.toFixed(2)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
