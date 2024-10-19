import { createSignal, onMount, onCleanup } from 'solid-js';

interface MatrixRainProps {
  className?: string;
  style?: { [key: string]: string };
  borderRadius?: string;
  glowColor?: string;
  glowSize?: string;
  specialText?: string;
}

const MatrixRain = (props: MatrixRainProps) => {
  const [canvas, setCanvas] = createSignal<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = createSignal({ width: 0, height: 0 });
  const [fontLoaded, setFontLoaded] = createSignal(false);

  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\';
  const fontSize = 8;
  const columnWidth = fontSize * 0.9;
  let columns: number;
  let drops: number[];
  let specialTextState: { text: string[]; position: number; yOffset: number } | null = null;

  const initializeDrops = () => {
    columns = Math.floor(dimensions().width / columnWidth);
    drops = new Array(columns).fill(1);
  };

  const wrapText = (text: string): string[] => {
    const maxLength = columns;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);

    return lines;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = 'rgba(0, 0, 0, .1)';
    ctx.fillRect(0, 0, dimensions().width, dimensions().height);

    ctx.font = `${fontSize}px 'Orbitron', sans-serif`;
    ctx.textBaseline = 'top';

    if (!specialTextState && Math.random() < 0.001) {
      const text = props.specialText || "UNDER CONSTRUCTION";
      const wrappedText = wrapText(text);
      const position = Math.floor(Math.random() * (columns - wrappedText[0].length));
      specialTextState = { text: wrappedText, position, yOffset: 0 };
    }

    for (let i = 0; i < drops.length; i++) {
      let text = characters[Math.floor(Math.random() * characters.length)];
      let isSpecial = false;
      let specialLineIndex = -1;

      if (specialTextState) {
        specialTextState.text.forEach((line, index) => {
          if (i >= specialTextState!.position && i < specialTextState!.position + line.length) {
            const charIndex = i - specialTextState!.position;
            if (charIndex < line.length) {
              text = line[charIndex];
              isSpecial = true;
              specialLineIndex = index;
            }
          }
        });
      }

      const blue = Math.floor(Math.random() * 55) + 200;
      const green = Math.floor(blue * 0.8);
      const alpha = Math.random() * 0.5 + 0.5;

      if (isSpecial) {
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
      } else {
        ctx.fillStyle = `rgba(100, ${green}, ${blue}, ${alpha})`;
        ctx.shadowColor = `rgba(100, ${green}, ${blue}, 0.8)`;
      }
      ctx.shadowBlur = 2;

      const x = i * columnWidth;
      const y = isSpecial 
        ? (specialTextState!.yOffset + specialLineIndex) * fontSize 
        : drops[i] * fontSize;

      ctx.fillText(text, x, y);

      ctx.shadowBlur = 0;

      if (!isSpecial) {
        drops[i] += 0.75;

        if (drops[i] * fontSize > dimensions().height && Math.random() > 0.99) {
          drops[i] = 0;
        }
      }
    }

    if (specialTextState) {
      specialTextState.yOffset += 0.75;
      if (specialTextState.yOffset * fontSize > dimensions().height) {
        specialTextState = null;
      }
    }
  };

  const updateDimensions = () => {
    const canvasElement = canvas();
    if (canvasElement) {
      const rect = canvasElement.getBoundingClientRect();
      const width = Math.ceil(rect.width);
      const height = Math.ceil(rect.height);
      setDimensions({ width, height });
      canvasElement.width = width;
      canvasElement.height = height;
      initializeDrops();
    }
  };

  onMount(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    link.onload = () => {
      setFontLoaded(true);
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    const canvasElement = canvas();
    if (canvasElement) {
      resizeObserver.observe(canvasElement);
    }

    updateDimensions();

    const ctx = canvasElement?.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      const interval = setInterval(() => {
        if (fontLoaded()) {
          draw(ctx);
        }
      }, 33);
      onCleanup(() => {
        clearInterval(interval);
        resizeObserver.disconnect();
      });
    }
  });

  const borderRadius = props.borderRadius || '10px';
  const glowColor = props.glowColor || 'rgba(100, 200, 255, 0.5)';
  const glowSize = props.glowSize || '10px';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        'border-radius': borderRadius,
        overflow: 'hidden',
        'box-shadow': `0 0 ${glowSize} ${glowColor}`,
        ...props.style
      }}
    >
      <canvas
        ref={setCanvas}
        class={props.className}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          'border-radius': borderRadius,
          'image-rendering': 'auto',
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        }}
      />
    </div>
  );
};

export default MatrixRain;