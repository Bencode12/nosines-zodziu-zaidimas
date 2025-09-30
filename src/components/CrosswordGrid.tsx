import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CrosswordWord {
  id: number;
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  direction: 'across' | 'down';
  rule: string;
}

interface CellData {
  letter: string;
  wordIds: number[];
  isEditable: boolean;
}

const words: CrosswordWord[] = [
  {
    id: 1,
    word: 'DRĄSA',
    clue: 'Nebijojimas, narsa',
    startRow: 0,
    startCol: 1,
    direction: 'across',
    rule: '„ą" rašoma, nes kitose formose trumpėja: drąsa – drąsos'
  },
  {
    id: 2,
    word: 'GĘSTI',
    clue: 'Užgesinti, išsijungti',
    startRow: 2,
    startCol: 0,
    direction: 'across',
    rule: '„ę" rašoma, nes kaitoje atsiranda „e": gęsti – geso'
  },
  {
    id: 3,
    word: 'ĮKA',
    clue: 'Paprotys, įpratimas',
    startRow: 4,
    startCol: 2,
    direction: 'across',
    rule: '„į" rašoma, nes tai ilgas balsis, nekeičiamas: įka – įkaito'
  },
  {
    id: 4,
    word: 'MŪSŲ',
    clue: 'Mums priklausantis',
    startRow: 1,
    startCol: 4,
    direction: 'down',
    rule: '„ū" rašoma, nes išlaikytas senas ilgas balsis (uo): mūsų – mums'
  },
  {
    id: 5,
    word: 'SĄVOKA',
    clue: 'Supratimas, samprata',
    startRow: 0,
    startCol: 1,
    direction: 'down',
    rule: '„ą" rašoma, nes šaknyje balsis trumpėja: sąvoka – sąvokos'
  },
  {
    id: 6,
    word: 'NUOGĄSTAUTI',
    clue: 'Jausti baimę, nerimauti',
    startRow: 6,
    startCol: 1,
    direction: 'across',
    rule: '„ą" rašoma šaknyje, balsis išlaikomas prieš st: nuogąstavimas – nuogastauja'
  },
  {
    id: 7,
    word: 'KĘSTI',
    clue: 'Ištvermingai pakęsti',
    startRow: 8,
    startCol: 3,
    direction: 'across',
    rule: '„ę" rašoma šaknyje, nes kaitoje virsta „e": kęsti – kentė – kentėjo'
  },
  {
    id: 8,
    word: 'MĄSTYTI',
    clue: 'Galvoti, apmąstyti',
    startRow: 10,
    startCol: 0,
    direction: 'across',
    rule: '„ą" šaknyje prieš st, kitose formose: mąsto – mastė'
  },
  {
    id: 9,
    word: 'SĄRAŠAS',
    clue: 'Dalykų išvardijimas',
    startRow: 7,
    startCol: 7,
    direction: 'down',
    rule: '„ą" šaknyje, nes daugiskaitoje balsis kinta: sąrašas – sąrašo'
  },
  {
    id: 10,
    word: 'ŽĄSIS',
    clue: 'Vandens paukštis',
    startRow: 12,
    startCol: 5,
    direction: 'across',
    rule: '„ą" rašoma, nes kitose formose balsis trumpėja: žąsis – žąsies'
  }
];

const GRID_SIZE = 15;

export default function CrosswordGrid() {
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [userAnswers, setUserAnswers] = useState<string[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [hoveredWord, setHoveredWord] = useState<number | null>(null);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());
  const [cellAnimations, setCellAnimations] = useState<{[key: string]: string}>({});
  const [wordFeedback, setWordFeedback] = useState<{[wordId: number]: 'correct' | 'incorrect' | null}>({});

  useEffect(() => {
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    const newGrid: CellData[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill(null).map(() => ({
        letter: '',
        wordIds: [],
        isEditable: false
      }))
    );

    const newUserAnswers: string[][] = Array(GRID_SIZE).fill(null).map(() =>
      Array(GRID_SIZE).fill('')
    );

    // Place words in grid
    words.forEach(word => {
      for (let i = 0; i < word.word.length; i++) {
        const row = word.direction === 'across' ? word.startRow : word.startRow + i;
        const col = word.direction === 'across' ? word.startCol + i : word.startCol;
        
        if (row < GRID_SIZE && col < GRID_SIZE) {
          newGrid[row][col].letter = word.word[i];
          newGrid[row][col].wordIds.push(word.id);
          newGrid[row][col].isEditable = true;
        }
      }
    });

    setGrid(newGrid);
    setUserAnswers(newUserAnswers);
  };

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col].isEditable) {
      setSelectedCell({row, col});
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;

    const {row, col} = selectedCell;
    const key = e.key.toUpperCase();

    // Only handle specific keys and prevent default for those we process
    if (key.match(/^[A-ZĄČĘĖĮŠŲŪ]$/)) {
      e.preventDefault();
      const newAnswers = [...userAnswers];
      newAnswers[row][col] = key;
      setUserAnswers(newAnswers);
      
      // Check if words are completed after a small delay to show the filled word
      setTimeout(() => checkCompletedWords(newAnswers), 100);
      
      // Move to next cell
      moveToNextCell(row, col);
    } else if (key === 'BACKSPACE') {
      e.preventDefault();
      const newAnswers = [...userAnswers];
      newAnswers[row][col] = '';
      setUserAnswers(newAnswers);
      
      // Clear any existing animations when user starts editing
      setCellAnimations({});
      setWordFeedback({});
      
      checkCompletedWords(newAnswers);
    } else if (key === 'ARROWLEFT' || key === 'ARROWRIGHT' || key === 'ARROWUP' || key === 'ARROWDOWN') {
      e.preventDefault();
      handleArrowKeys(key, row, col);
    }
  };

  const handleArrowKeys = (key: string, currentRow: number, currentCol: number) => {
    let newRow = currentRow;
    let newCol = currentCol;

    switch (key) {
      case 'ARROWLEFT':
        newCol = Math.max(0, currentCol - 1);
        break;
      case 'ARROWRIGHT':
        newCol = Math.min(GRID_SIZE - 1, currentCol + 1);
        break;
      case 'ARROWUP':
        newRow = Math.max(0, currentRow - 1);
        break;
      case 'ARROWDOWN':
        newRow = Math.min(GRID_SIZE - 1, currentRow + 1);
        break;
    }

    // Find the nearest editable cell in the direction
    if (grid[newRow][newCol].isEditable) {
      setSelectedCell({row: newRow, col: newCol});
    }
  };

  const checkCompletedWords = (answers: string[][]) => {
    const completed = new Set<number>();
    const newCellAnimations: {[key: string]: string} = {};
    
    words.forEach(word => {
      let isComplete = true;
      let isAttempted = true; // Check if all cells are filled
      let userWord = '';
      
      // Check if word is fully filled and build user's answer
      for (let i = 0; i < word.word.length; i++) {
        const row = word.direction === 'across' ? word.startRow : word.startRow + i;
        const col = word.direction === 'across' ? word.startCol + i : word.startCol;
        
        const userAnswer = answers[row][col];
        userWord += userAnswer;
        
        if (!userAnswer) {
          isAttempted = false;
        }
        
        if (userAnswer !== word.word[i]) {
          isComplete = false;
        }
      }
      
      // If word is attempted (all cells filled), give feedback
      if (isAttempted) {
        const animationType = isComplete ? 'animate-glow-success' : 'animate-shake-error';
        
        // Apply animation to all cells of this word
        for (let i = 0; i < word.word.length; i++) {
          const row = word.direction === 'across' ? word.startRow : word.startRow + i;
          const col = word.direction === 'across' ? word.startCol + i : word.startCol;
          const cellKey = `${row}-${col}`;
          newCellAnimations[cellKey] = animationType;
        }
        
        // Set feedback state
        setWordFeedback(prev => ({
          ...prev,
          [word.id]: isComplete ? 'correct' : 'incorrect'
        }));
        
        // Clear animations after they complete
        setTimeout(() => {
          setCellAnimations(prev => {
            const updated = {...prev};
            for (let i = 0; i < word.word.length; i++) {
              const row = word.direction === 'across' ? word.startRow : word.startRow + i;
              const col = word.direction === 'across' ? word.startCol + i : word.startCol;
              const cellKey = `${row}-${col}`;
              delete updated[cellKey];
            }
            return updated;
          });
          
          setWordFeedback(prev => ({
            ...prev,
            [word.id]: null
          }));
        }, 1500);
      }
      
      if (isComplete) completed.add(word.id);
    });
    
    setCellAnimations(newCellAnimations);
    setCompletedWords(completed);
  };

  const moveToNextCell = (currentRow: number, currentCol: number) => {
    // Find next editable cell
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if ((row > currentRow || (row === currentRow && col > currentCol)) && 
            grid[row][col].isEditable) {
          setSelectedCell({row, col});
          return;
        }
      }
    }
  };

  const getCellClasses = (row: number, col: number) => {
    const cell = grid[row][col];
    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
    const isInHoveredWord = hoveredWord !== null && cell.wordIds.includes(hoveredWord);
    const isCorrect = cell.isEditable && userAnswers[row][col] === cell.letter;
    const hasUserInput = userAnswers[row][col] !== '';
    const cellKey = `${row}-${col}`;
    const animation = cellAnimations[cellKey];

    return cn(
      'w-10 h-10 border flex items-center justify-center text-lg font-semibold cursor-pointer transition-all duration-200',
      {
        'bg-crossword-empty border-crossword-cell-border': !cell.isEditable,
        'bg-crossword-cell border-crossword-cell-border hover:bg-crossword-cell-active': cell.isEditable && !animation,
        'ring-2 ring-primary ring-opacity-50 bg-crossword-cell-active': isSelected && !animation,
        'bg-accent/30 border-accent': isInHoveredWord && !isSelected && !animation,
        'bg-crossword-cell-correct border-success text-success-foreground': isCorrect && !animation,
        'text-foreground': hasUserInput && !isCorrect && !animation,
        'text-muted-foreground': !hasUserInput && !animation
      },
      animation
    );
  };

  const handleWordHover = (wordId: number | null) => {
    setHoveredWord(wordId);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-6" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
          Lietuvių kalbos kryžiažodis
        </h1>
        <p className="text-muted-foreground">
          Žodžiai su nosinėmis raidėmis. Užveskite pelytę ant žodžio, kad pamatytumėte taisyklę.
        </p>
      </div>

      <div className="grid grid-cols-15 gap-0 shadow-soft rounded-lg overflow-hidden bg-white p-2">
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={getCellClasses(rowIndex, colIndex)}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {cell.isEditable ? (
                userAnswers[rowIndex][colIndex] || ''
              ) : ''}
            </div>
          ))
        )}
      </div>

      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Užuominos:</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {words.map(word => (
            <div
              key={word.id}
              className={cn(
                'p-4 rounded-lg border transition-all duration-200 cursor-pointer relative group',
                {
                  'bg-success/10 border-success text-success-foreground': completedWords.has(word.id),
                  'bg-card border-border hover:border-accent hover:shadow-soft': !completedWords.has(word.id)
                }
              )}
              onMouseEnter={() => handleWordHover(word.id)}
              onMouseLeave={() => handleWordHover(null)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-primary">
                  {word.id}. {word.direction === 'across' ? '→' : '↓'}
                </span>
                {completedWords.has(word.id) && (
                  <span className="text-success">✓</span>
                )}
              </div>
              <p className="text-sm">{word.clue}</p>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-tooltip-bg text-tooltip-text text-sm rounded-lg shadow-tooltip opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                {word.rule}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-tooltip-bg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {completedWords.size === words.length && (
        <div className="text-center p-6 bg-success/10 border border-success rounded-lg">
          <h2 className="text-2xl font-bold text-success mb-2">Sveikiname! 🎉</h2>
          <p className="text-success-foreground">Jūs sėkmingai išsprendėte kryžiažodį!</p>
        </div>
      )}
    </div>
  );
}