import { Pixels, noise } from "./pixels.ts";
export function skyline(canvas: HTMLCanvasElement) {
  const g = new Pixels(canvas, 900, 117);
  for (let y = 0; y < 117; y++)
    g.rect(
      0,
      y,
      900,
      1,
      "rgb(" +
        Math.round(14 + y * 0.22) +
        "," +
        Math.round(17 + y * 0.07) +
        "," +
        Math.round(32 + y * 0.38) +
        ")",
    );
  for (let i = 0; i < 170; i++) {
    const x = noise(i, 1) % 900,
      y = noise(i, 2) % 95;
    g.rect(x, y, i % 12 === 0 ? 2 : 1, 1, i % 5 === 0 ? "#ad94cb" : "#675d84");
  }
  // Banded lavender moon, drawn with horizontal pixel spans.
  const cx = 681,
    cy = 44,
    r = 35;
  g.glow(cx, cy, 90, "#c28af42a");
  for (let d = -r; d <= r; d++) {
    const a = Math.floor(Math.sqrt(r * r - d * d));
    if (d > 3 && (d % 7 === 0 || (d > 16 && d % 7 === 1))) continue;
    g.rect(
      cx - a,
      cy + d,
      2 * a + 1,
      1,
      d < -14 ? "#e1c7ee" : d < 2 ? "#cfaaea" : d < 17 ? "#b38ad5" : "#986fb6",
    );
  }
  for (let layer = 0; layer < 3; layer++) {
    let x = -32 + layer * 11;
    for (let i = 0; x < 920; i++) {
      const n = noise(i, layer, 9),
        w = 9 + (n % 23),
        base = 98 + layer * 10;
      const h = 9 + ((n >>> 8) % (23 + layer * 4)),
        y = base - h;
      const col = ["#302940", "#29263e", "#1c2034"][layer];
      g.rect(x, y, w, h + 24, col);
      g.rect(x + 3, y - 3, w - 6, 3, col);
      if (n % 5 === 0) {
        g.rect(x + w / 2, y - 12, 1, 12, col);
        g.rect(x + w / 2, y - 12, 1, 1, "#bd92bb");
      }
      for (let j = 2; j < w - 3; j += 4)
        for (let k = 4; k < h; k += 5)
          if (noise(i + j, k, layer) % 7 < 3)
            g.rect(
              x + j,
              y + k,
              2,
              1,
              ["#65506e", "#725a7d", "#6b7286"][layer],
            );
      x += w - 1;
    }
  }
  function tower(x: number, y: number, w: number, h: number, n: number) {
    g.rect(x + 4, y - 3, w - 9, 3, "#45405e");
    g.rect(x + 8, y - 6, 9, 3, "#27253b");
    g.rect(x, y, w, h, "#191e31");
    g.rect(x + 1, y + 1, w - 2, 2, "#63556e");
    g.rect(x + w - 7, y + 3, 6, h - 3, "#2b2b42");
    for (let j = 4; j < w - 7; j += 5)
      for (let k = 6; k < h - 3; k += 6) {
        const rnd = noise(j + n, k);
        g.rect(
          x + j,
          y + k,
          3,
          2,
          rnd % 6 < 3 ? ["#bf8ca0", "#85b2c1", "#b3a0cf"][rnd % 3] : "#34364c",
        );
      }
    g.rect(x + 2, y + 6, 1, h - 5, "#40394d");
  }
  tower(478, 56, 35, 70, 2);
  tower(521, 38, 40, 82, 8);
  tower(576, 66, 54, 62, 4);
  tower(712, 48, 46, 74, 5);
  tower(774, 28, 34, 99, 1);
  tower(830, 52, 48, 77, 7);
  g.rect(530, 30, 23, 8, "#373249");
  g.rect(538, 15, 2, 15, "#7b607c");
  g.rect(537, 14, 4, 2, "#ffabbf");
  g.rect(780, 18, 22, 10, "#3a334b");
  g.rect(789, 4, 2, 15, "#65526d");
  g.rect(788, 3, 4, 2, "#ec9eb6");
  // Outboard vertical neon sign with a bracket.
  g.rect(763, 52, 14, 2, "#8c7899");
  g.rect(763, 74, 14, 2, "#8c7899");
  g.rect(759, 49, 10, 35, "#191b30");
  g.rect(760, 50, 8, 33, "#765977");
  for (let i = 0; i < 4; i++) {
    g.rect(762, 53 + i * 7, 4, 1, "#edbbcf");
    g.rect(762 + (i % 2), 54 + i * 7, 1, 4, "#edbbcf");
    g.rect(762, 57 + i * 7, 5, 1, "#edbbcf");
  }
  // Suspended lines and rooftop parapets.
  for (let i = 0; i < 112; i++)
    g.rect(
      805 + i,
      43 + Math.floor(Math.sin((i / 111) * Math.PI) * 9),
      1,
      1,
      "#343044",
    );
  g.rect(653, 100, 95, 3, "#73617e");
  g.rect(650, 103, 102, 15, "#131a2a");
  g.rect(849, 92, 56, 2, "#73617e");
  g.rect(846, 94, 59, 24, "#141b2b");
  for (let j = 0; j < 31; j++) g.rect(651 + j * 3, 104, 1, 3, "#40405a");
  g.rect(665, 90, 16, 10, "#37364b");
  g.rect(664, 89, 18, 2, "#62536c");
  for (let j = 0; j < 5; j++) g.rect(667 + j * 2, 93, 1, 4, "#1b2432");
  // A getaway thief, coat blowing above the street.
  g.stamp(
    702,
    69,
    [
      ".......kkk.....",
      "......kpppk....",
      ".....kpppppk...",
      ".....kpmmtmk...",
      ".....kffffkk...",
      "......kpplk....",
      "...kkkkppplk...",
      ".kkplpppppplk..",
      "kpppkkppplklk..",
      "kkkk.kplllk.lk.",
      "....kppklkk..k.",
      "...kpppk.lpk...",
      "..kppkpk..lpk..",
      "..kk..pk..lpk..",
      ".....kllk.kllk.",
    ],
    {
      k: "#101726",
      p: "#32334c",
      l: "#5c526e",
      m: "#9df4d9",
      t: "#d3b1b3",
      f: "#65516a",
    },
    2,
  );
}
export function wordmark(canvas: HTMLCanvasElement) {
  const g = new Pixels(canvas, 196, 24);
  // Wide, angular arcade lettering with a stepped extrusion.
  const chars: Record<string, string[]> = {
    E: [
      "1111111",
      "1100000",
      "1100000",
      "1111110",
      "1100000",
      "1100000",
      "1111111",
    ],
    C: [
      "0111111",
      "1100000",
      "1100000",
      "1100000",
      "1100000",
      "1100000",
      "0111111",
    ],
    H: [
      "1100011",
      "1100011",
      "1100011",
      "1111111",
      "1100011",
      "1100011",
      "1100011",
    ],
    O: [
      "0111110",
      "1100011",
      "1100011",
      "1100011",
      "1100011",
      "1100011",
      "0111110",
    ],
    I: ["11111", "01110", "01110", "01110", "01110", "01110", "11111"],
    S: [
      "0111111",
      "1100000",
      "1100000",
      "0111110",
      "0000011",
      "0000011",
      "1111110",
    ],
    T: [
      "1111111",
      "1111111",
      "0011100",
      "0011100",
      "0011100",
      "0011100",
      "0011100",
    ],
  };
  let x = 4;
  for (const [i, ch] of [..."ECHO HEIST"].entries()) {
    if (ch === " ") {
      x += 7;
      continue;
    }
    const pattern = chars[ch];
    for (let j = 0; j < pattern.length; j++)
      for (let k = 0; k < pattern[j].length; k++)
        if (pattern[j][k] === "1") {
          const lean = Math.floor((6 - j) / 3);
          g.rect(
            x + k * 2 + lean,
            5 + j * 2,
            2,
            5,
            i < 4 ? "#28685f" : "#57436e",
          );
        }
    for (let j = 0; j < pattern.length; j++)
      for (let k = 0; k < pattern[j].length; k++)
        if (pattern[j][k] === "1") {
          const lean = Math.floor((6 - j) / 3);
          g.rect(
            x + k * 2 + lean,
            3 + j * 2,
            2,
            2,
            i < 4
              ? j < 4
                ? "#a6ffe1"
                : "#79e8c4"
              : j < 4
                ? "#e0c7fd"
                : "#baa0e5",
          );
        }
    x += pattern[0].length * 2 + 3;
  }
  // Canvas is trimmed to the bespoke lettering.
  const cut = g.ctx.getImageData(0, 0, x + 1, 23);
  canvas.width = x + 1;
  canvas.height = 23;
  g.ctx.putImageData(cut, 0, 0);
}
