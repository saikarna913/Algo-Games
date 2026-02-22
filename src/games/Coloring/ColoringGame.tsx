// src/games/coloring/ColoringGame.tsx

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import {
  createInitialState,
  applyMove,
  generateCycle,
  generateComplete,
  generateGrid,
  generateRandom,
} from './coloringLogic';

const GRAPH_SIZE = Math.min(Dimensions.get('window').width - 32, 380);

const GRAPH_FAMILIES = [
  { name: 'Cycle', generator: generateCycle },
  { name: 'Complete', generator: generateComplete },
  { name: 'Grid', generator: generateGrid },
  { name: 'Random', generator: generateRandom },
];

const COLOR_POOL = [
  '#E53935',
  '#1E88E5',
  '#43A047',
  '#FDD835',
  '#8E24AA',
  '#FB8C00',
];

export default function ColoringGame() {
  const [familyIndex, setFamilyIndex] = useState(0);
  const [size, setSize] = useState(8);
  const [kColors, setKColors] = useState(3);
  const [selectedColor, setSelectedColor] = useState(0);
  const [infoVisible, setInfoVisible] = useState(false);

  const [state, setState] = useState(() =>
    createInitialState(GRAPH_FAMILIES[0].generator, 8, 3)
  );

  // ✅ Regenerate board when settings change
  useEffect(() => {
    setState(
      createInitialState(
        GRAPH_FAMILIES[familyIndex].generator,
        size,
        kColors
      )
    );
  }, [familyIndex, size, kColors]);

  const handleNodePress = useCallback(
    (id: number) => {
      if (state.gameOver) return;

      const newState = applyMove(state, id, selectedColor);

      if (newState !== state) {
        setState(newState);
      }
    },
    [state, selectedColor]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Graph Coloring</Text>
        <TouchableOpacity onPress={() => setInfoVisible(true)}>
          <Text style={styles.info}>ℹ️</Text>
        </TouchableOpacity>
      </View>

      <Svg width={GRAPH_SIZE} height={GRAPH_SIZE}>
        {state.edges.map((e, i) => (
          <Line
            key={i}
            x1={state.nodes[e.from].x * GRAPH_SIZE}
            y1={state.nodes[e.from].y * GRAPH_SIZE}
            x2={state.nodes[e.to].x * GRAPH_SIZE}
            y2={state.nodes[e.to].y * GRAPH_SIZE}
            stroke="#999"
          />
        ))}

        {state.nodes.map(node => (
          <Circle
            key={node.id}
            cx={node.x * GRAPH_SIZE}
            cy={node.y * GRAPH_SIZE}
            r={18}
            fill={
              node.color !== null
                ? COLOR_POOL[node.color]
                : '#DDD'
            }
            stroke="#333"
            strokeWidth={2}
            onPress={() => handleNodePress(node.id)}
          />
        ))}
      </Svg>

      <Text style={styles.turn}>
        {state.gameOver
          ? state.winner === 'draw'
            ? 'Draw!'
            : state.winner === 'player1'
            ? 'Player 1 Wins!'
            : 'Player 2 Wins!'
          : `Player ${state.currentPlayer + 1}'s Turn`}
      </Text>

      {/* Color Palette */}
      <View style={styles.palette}>
        {COLOR_POOL.slice(0, kColors).map((c, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.colorBtn,
              { backgroundColor: c },
              selectedColor === i && styles.selected,
            ]}
            onPress={() => setSelectedColor(i)}
          />
        ))}
      </View>

      {/* Graph Family Buttons */}
      <View style={styles.controls}>
        {GRAPH_FAMILIES.map((f, i) => (
          <TouchableOpacity
            key={i}
            style={styles.ctrlBtn}
            onPress={() => setFamilyIndex(i)}
          >
            <Text>{f.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reset Button */}
      <TouchableOpacity
        style={styles.reset}
        onPress={() =>
          setState(
            createInitialState(
              GRAPH_FAMILIES[familyIndex].generator,
              size,
              kColors
            )
          )
        }
      >
        <Text style={{ color: 'white' }}>Reset</Text>
      </TouchableOpacity>

      {/* Info Modal */}
      <Modal visible={infoVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Graph Coloring</Text>
            <Text>
              Color nodes so adjacent nodes never share the same color.
              Determining the minimum number of colors required is an
              NP-complete problem.
            </Text>
            <TouchableOpacity onPress={() => setInfoVisible(false)}>
              <Text style={{ marginTop: 12, color: '#1E88E5' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold' },
  info: { fontSize: 20, marginLeft: 10 },
  turn: { marginVertical: 10, fontWeight: 'bold' },
  palette: { flexDirection: 'row', marginVertical: 10 },
  colorBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 6,
  },
  selected: { borderWidth: 3, borderColor: '#000' },
  controls: { flexDirection: 'row', flexWrap: 'wrap' },
  ctrlBtn: {
    padding: 8,
    borderWidth: 1,
    margin: 4,
    borderRadius: 6,
  },
  reset: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 10 },
});