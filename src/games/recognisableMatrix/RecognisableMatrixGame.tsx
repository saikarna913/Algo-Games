// src/games/recognisableMatrix/RecognisableMatrixGame.tsx
import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import GameHeader from '../../core/components/GameHeader';
import { useGameStore } from '../../core/store';
import {
  createInitialState,
  applyRowSwap,
  applyColSwap,
  undoLastMove,
  resetState,
  isAllDiagonalOnes,
  checkRecognisable,
  type MatrixState,
} from './recognisableMatrixLogic';
import type { GameScreenProps } from '../registry';

// ── Palette ───────────────────────────────────────────────────────────────────
const P = {
  creamLt: '#faf3e8',
  creamDk: '#e8ceaa',
  ink: '#2e3a4e',
  slateLt: '#8292ae',
  red: '#b84c2e',
  redLight: '#f2e0d5',
  redMid: '#dba08a',
  blue: '#2980b9',
  blueLight: '#eaf4fb',
  blueMid: '#aed6f1',
  teal: '#78938a',
  green: '#27ae60',
  greenLight: '#d5f4e6',
  gold: '#f39c12',
  white: '#fff',
  black: '#000',
};

interface ExtendedGameScreenProps extends GameScreenProps {
  onPlayerChange?: (player: 0 | 1) => void;
}

export default forwardRef(function RecognisableMatrixGame(
  { mode, onGameEnd, onExit, showHeader = true, onPlayerChange }: ExtendedGameScreenProps,
  ref
) {
  const { width, height } = useWindowDimensions();
  const [state, setState] = useState<MatrixState>(() => createInitialState(4));
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);
  const [matrixSize, setMatrixSize] = useState(4);
  const addScore = useGameStore((s) => s.addScore);

  const boardSize = Math.min(width - 40, height * 0.55, 420);
  const cellSize = boardSize / state.n;

  // Notify parent of player changes
  useEffect(() => {
    onPlayerChange?.(state.currentPlayer);
  }, [state.currentPlayer, onPlayerChange]);

  // Handle row swap selection
  const handleRowClick = useCallback(
    (rowIdx: number) => {
      if (state.gameOver) return;

      if (selectedRow === null) {
        setSelectedRow(rowIdx);
      } else {
        if (selectedRow !== rowIdx) {
          const newState = applyRowSwap(state, selectedRow, rowIdx);
          setState(newState);

          if (newState.gameOver && newState.winner) {
            if (newState.winner === 'red') {
              addScore('red', 1);
            }
            setTimeout(() => onGameEnd(newState.winner!), 600);
          }
        }
        setSelectedRow(null);
      }
    },
    [state, selectedRow, addScore, onGameEnd]
  );

  // Handle column swap selection
  const handleColClick = useCallback(
    (colIdx: number) => {
      if (state.gameOver) return;

      if (selectedCol === null) {
        setSelectedCol(colIdx);
      } else {
        if (selectedCol !== colIdx) {
          const newState = applyColSwap(state, selectedCol, colIdx);
          setState(newState);

          if (newState.gameOver && newState.winner) {
            if (newState.winner === 'red') {
              addScore('red', 1);
            }
            setTimeout(() => onGameEnd(newState.winner!), 600);
          }
        }
        setSelectedCol(null);
      }
    },
    [state, selectedCol, addScore, onGameEnd]
  );

  // Handle undo
  const handleUndo = useCallback(() => {
    if (state.moves.length === 0) return;
    const newState = undoLastMove(state);
    setState(newState);
    setSelectedRow(null);
    setSelectedCol(null);
  }, [state]);

  // Handle reset
  const handleReset = useCallback(() => {
    const fresh = resetState(state);
    setState(fresh);
    setSelectedRow(null);
    setSelectedCol(null);
    onPlayerChange?.(fresh.currentPlayer);
  }, [state, onPlayerChange]);

  // Handle new game with different size
  const handleNewGame = useCallback((size: number) => {
    setMatrixSize(size);
    const fresh = createInitialState(size);
    setState(fresh);
    setSelectedRow(null);
    setSelectedCol(null);
    onPlayerChange?.(fresh.currentPlayer);
  }, [onPlayerChange]);

  useImperativeHandle(ref, () => ({
    reset: handleReset,
  }));

  const isDiagonalComplete = isAllDiagonalOnes(state.matrix, state.n);
  const movesRemaining = state.maxMoves - (state.rowSwaps + state.colSwaps);
  const motoCurrent = state.currentPlayer === 0 ? 'SWAP ROWS' : 'SWAP COLUMNS';

  // ── Cell rendering ────────────────────────────────────────────────────────
  const renderMatrix = () => {
    return (
      <View>
        {/* Column headers */}
        <View style={[styles.rowContainer, { marginLeft: cellSize }]}>
          {Array(state.n)
            .fill(0)
            .map((_, col) => (
              <TouchableOpacity
                key={`col-header-${col}`}
                onPress={() => handleColClick(col)}
                style={[
                  styles.colHeader,
                  {
                    width: cellSize,
                    height: cellSize * 0.8,
                    backgroundColor:
                      selectedCol === col
                        ? P.blueMid
                        : P.blue,
                    borderWidth: selectedCol === col ? 3 : 1,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.headerText, { color: P.white }]}>C{col}</Text>
              </TouchableOpacity>
            ))}
        </View>

        {/* Matrix rows with row headers */}
        {Array(state.n)
          .fill(0)
          .map((_, row) => (
            <View key={`row-${row}`} style={styles.rowContainer}>
              {/* Row header */}
              <TouchableOpacity
                onPress={() => handleRowClick(row)}
                style={[
                  styles.rowHeader,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor:
                      selectedRow === row
                        ? P.redMid
                        : P.red,
                    borderWidth: selectedRow === row ? 3 : 1,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.headerText, { color: P.white }]}>R{row}</Text>
              </TouchableOpacity>

              {/* Matrix cells */}
              {Array(state.n)
                .fill(0)
                .map((_, col) => {
                  const val = state.matrix[row][col];
                  const isDiag = row === col;
                  const isDiagOne = isDiag && val === 1;

                  let bgColor = P.creamLt;
                  if (val === 1) {
                    bgColor = isDiag ? P.greenLight : '#ffffcc';
                  } else {
                    bgColor = '#f5f5f5';
                  }

                  if (isDiagOne) {
                    bgColor = P.greenLight;
                  }

                  return (
                    <View
                      key={`cell-${row}-${col}`}
                      style={[
                        styles.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: bgColor,
                          borderColor: isDiag ? P.gold : P.creamDk,
                          borderWidth: isDiag ? 2 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.cellContent,
                          {
                            backgroundColor: val === 1 ? P.green : '#999',
                            borderRadius: cellSize * 0.3,
                            width: cellSize * 0.4,
                            height: cellSize * 0.4,
                          },
                        ]}
                      >
                        <Text style={[styles.cellText, { fontSize: cellSize * 0.25 }]}>
                          {val}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>
          ))}
      </View>
    );
  };

  // Status message
  const statusMessage = state.gameOver
    ? state.winner === 'red'
      ? `🎉 YOU WIN! Diagonal complete in ${state.rowSwaps + state.colSwaps} swaps`
      : `⏱️ OUT OF MOVES! Try again!`
    : `${motoCurrent} | Moves: ${state.rowSwaps + state.colSwaps}/${state.maxMoves}`;

  const statusColor = state.gameOver
    ? state.winner === 'red'
      ? P.green
      : P.red
    : state.currentPlayer === 0
      ? P.red
      : P.blue;

  return (
    <View style={styles.container}>
      {showHeader && (
        <GameHeader
          onBack={onExit}
          title="Recognisable Matrix"
          onInfo={() => setInfoVisible(true)}
        />
      )}

      <View style={styles.content}>
        {/* Status */}
        <View style={[styles.statusBar, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusMessage}
          </Text>
        </View>

        {/* Matrix */}
        <ScrollView
          horizontal
          style={styles.matrixScroll}
          contentContainerStyle={styles.matrixContainer}
        >
          <View>{renderMatrix()}</View>
        </ScrollView>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: state.moves.length === 0 ? P.slateLt + '77' : P.teal,
              },
            ]}
            onPress={handleUndo}
            disabled={state.moves.length === 0}
          >
            <Text style={styles.buttonText}>↶ UNDO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: P.gold }]}
            onPress={handleReset}
          >
            <Text style={styles.buttonText}>🔄 NEW GAME</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: P.blue }]}
            onPress={() => setInfoVisible(true)}
          >
            <Text style={styles.buttonText}>ℹ️ RULES</Text>
          </TouchableOpacity>
        </View>

        {/* Size selection (when game over) */}
        {state.gameOver && (
          <View style={styles.sizeSelection}>
            <Text style={styles.sizeLabel}>Try different size:</Text>
            <View style={styles.sizeButtons}>
              {[3, 4, 5].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.sizeButton,
                    {
                      backgroundColor: matrixSize === size ? P.blue : P.creamDk,
                    },
                  ]}
                  onPress={() => handleNewGame(size)}
                >
                  <Text
                    style={[
                      styles.sizeButtonText,
                      { color: matrixSize === size ? P.white : P.ink },
                    ]}
                  >
                    {size}×{size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Info Modal */}
      <Modal
        visible={infoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How to Play</Text>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>
                <Text style={styles.bold}>Goal:</Text> Make all diagonal elements = 1
              </Text>

              <Text style={styles.modalText}>
                <Text style={styles.bold}>Rules:</Text>
              </Text>
              <Text style={styles.modalText}>• Click a row header (RED) to select it, then click another row to swap</Text>
              <Text style={styles.modalText}>• Click a column header (BLUE) to select it, then click another column to swap</Text>
              <Text style={styles.modalText}>• Diagonal cells are highlighted in GOLD</Text>
              <Text style={styles.modalText}>• You win if all diagonal cells = 1 within the move limit</Text>

              <Text style={styles.modalText}>
                <Text style={styles.bold}>Strategy:</Text> Use bipartite matching theory! A matrix is recognisable if a perfect matching exists where each row is matched to a column containing 1.
              </Text>

              <Text style={styles.modalText}>
                <Text style={styles.bold}>Colors:</Text>
              </Text>
              <Text style={styles.modalText}>• GREEN = diagonal element is 1 ✓</Text>
              <Text style={styles.modalText}>• YELLOW = non-diagonal element is 1</Text>
              <Text style={styles.modalText}>• GRAY = element is 0</Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setInfoVisible(false)}
            >
              <Text style={styles.modalButtonText}>GOT IT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: P.creamLt,
  },
  content: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBar: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  matrixScroll: {
    flex: 1,
    marginVertical: 8,
  },
  matrixContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
  },
  colHeader: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginHorizontal: 2,
  },
  rowHeader: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    marginVertical: 2,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 4,
  },
  cellContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontWeight: '700',
    color: P.white,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: P.white,
    fontWeight: '700',
    fontSize: 12,
  },
  sizeSelection: {
    marginTop: 16,
    alignItems: 'center',
  },
  sizeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: P.ink,
    marginBottom: 8,
  },
  sizeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  sizeButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: P.creamLt,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: P.ink,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalScroll: {
    marginBottom: 12,
  },
  modalText: {
    fontSize: 13,
    color: P.ink,
    lineHeight: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: '700',
  },
  modalButton: {
    backgroundColor: P.blue,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: P.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
