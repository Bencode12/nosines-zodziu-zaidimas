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
    word: 'KĄSNIS',
    clue: 'Maisto gabalas, kurį galima sukramtyti',
    startRow: 0,
    startCol: 2,
    direction: 'across',
    rule: 'Daiktavardis su nosine raide Ą'
  },
  {
    id: 2,
    word: 'ŠĘSTI',
    clue: 'Užimti sėdimą padėtį',
    startRow: 2,
    startCol: 0,
    direction: 'across',
    rule: 'Veiksmažodis su nosine raide Ę'
  },
  {
    id: 3,
    word: 'ĮEITI',
    clue: 'Patekti į vidų',
    startRow: 4,
    startCol: 1,
    direction: 'across',
    rule: 'Veiksmažodis su nosine raide Į'
  },
  {
    id: 4,
    word: 'UŽUOT',
    clue: 'Vietoje, pakeičiant',
    startRow: 1,
    startCol: 4,
    direction: 'down',
    rule: 'Prieveiksmo žodis su nosine raide Ų'
  },
  {
    id: 5,
    word: 'MĄSTYTI',
    clue: 'Apmąstyti, galvoti',
    startRow: 0,
    startCol: 2,
    direction: 'down',
    rule: 'Veiksmažodis su nosine raide Ą'
  }
];

const GRID_SIZE = 8;

export default function CrosswordGrid() {
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [userAnswers, setUserAnswers] = useState<string[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [hoveredWord, setHoveredWord] = useState<number | null>(null);
  const [completedWords, setCompletedWords] = useState<Set<number>>(new Set());

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;

    const {row, col} = selectedCell;
    const key = e.key.toUpperCase();

    if (key.match(/[A-ZĄČĘĖĮŠŲŪ]/)) {
      const newAnswers = [...userAnswers];
      newAnswers[row][col] = key;
      setUserAnswers(newAnswers);
      
      // Check if words are completed
      checkCompletedWords(newAnswers);
      
      // Move to next cell
      moveToNextCell(row, col);
    } else if (key === 'BACKSPACE') {
      const newAnswers = [...userAnswers];
      newAnswers[row][col] = '';
      setUserAnswers(newAnswers);
      checkCompletedWords(newAnswers);
    }
  };

  const checkCompletedWords = (answers: string[][]) => {
    const completed = new Set<number>();
    
    words.forEach(word => {
      let isComplete = true;
      for (let i = 0; i < word.word.length; i++) {
        const row = word.direction === 'across' ? word.startRow : word.startRow + i;
        const col = word.direction === 'across' ? word.startCol + i : word.startCol;
        
        if (answers[row][col] !== word.word[i]) {
          isComplete = false;
          break;
        }
      }
      if (isComplete) completed.add(word.id);
    });
    
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

    return cn(
      'w-10 h-10 border flex items-center justify-center text-lg font-semibold cursor-pointer transition-all duration-200',
      {
        'bg-crossword-empty border-crossword-cell-border': !cell.isEditable,
        'bg-crossword-cell border-crossword-cell-border hover:bg-crossword-cell-active': cell.isEditable,
        'ring-2 ring-primary ring-opacity-50 bg-crossword-cell-active': isSelected,
        'bg-accent/30 border-accent': isInHoveredWord && !isSelected,
        'bg-crossword-cell-correct border-success text-success-foreground': isCorrect,
        'text-foreground': hasUserInput && !isCorrect,
        'text-muted-foreground': !hasUserInput
      }
    );
  };

  const handleWordHover = (wordId: number | null) => {
    setHoveredWord(wordId);
  };

  return (
    <div className="flex flex-col items-center gap-8 p-6" onKeyDown={handleKeyPress} tabIndex={0}>
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
          Lietuvių kalbos kryžiažodis
        </h1>
        <p className="text-muted-foreground">
          Žodžiai su nosinėmis raidėmis. Užveskite pelytę ant žodžio, kad pamatytumėte taisyklę.
        </p>
      </div>

      <div className="grid grid-cols-8 gap-0 shadow-soft rounded-lg overflow-hidden bg-white p-2">
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