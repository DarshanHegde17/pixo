import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PathFinderAudioService } from '../../../services/pathFinderAudioService';

export const PathFinderGrid = ({
  stage,
  path = [],
  onPathChange,
  isLocked = false,
  onTileBlocked,
}) => {
  const windowWidth = Dimensions.get('window').width;
  const gridSize = stage?.gridSize || 5;

  // Responsive tile size calculated for mobile screens (Samsung F55 ~380-412px)
  const maxGridWidth = Math.min(windowWidth - 36, 420);
  const tileSize = Math.floor(maxGridWidth / gridSize);
  const actualGridSize = tileSize * gridSize;

  const gridContainerRef = useRef(null);
  const gridLayoutRef = useRef({ x: 0, y: 0, width: actualGridSize, height: actualGridSize });

  // Lookup sets for instant queries
  const blockedSet = new Set((stage?.blocked || []).map(([r, c]) => `${r},${c}`));
  const trapSet = new Set((stage?.traps || []).map(([r, c]) => `${r},${c}`));
  const numberMap = new Map((stage?.numbers || []).map((n) => [`${n.r},${n.c}`, n.val]));
  const keyMap = new Map((stage?.keys || []).map((k) => [`${k.r},${k.c}`, k]));

  const pathSet = new Set((path || []).map(([r, c]) => `${r},${c}`));
  const pathIndexMap = new Map((path || []).map(([r, c], idx) => [`${r},${c}`, idx]));

  const [startR, startC] = stage?.start || [0, 0];
  const [finishR, finishC] = stage?.finish || [gridSize - 1, gridSize - 1];

  /**
   * Handle interacting with a tile (tap or drag hover)
   */
  const handleTileInteraction = useCallback(
    (r, c) => {
      if (isLocked || !onPathChange) return;
      if (r < 0 || r >= gridSize || c < 0 || c >= gridSize) return;

      const currentPath = Array.isArray(path) ? path : [];
      const currentLen = currentPath.length;

      // If empty path, can only start at START (S)
      if (currentLen === 0) {
        if (r === startR && c === startC) {
          PathFinderAudioService.playStep();
          onPathChange([[r, c]]);
        }
        return;
      }

      const lastTile = currentPath[currentLen - 1];
      const [lastR, lastC] = lastTile;

      // 1. Tapped current head: do nothing
      if (lastR === r && lastC === c) {
        return;
      }

      // 2. Tapped previously visited tile: backtrack/undo to that tile!
      const existingIdx = pathIndexMap.get(`${r},${c}`);
      if (existingIdx !== undefined) {
        const truncated = currentPath.slice(0, existingIdx + 1);
        PathFinderAudioService.playUndo();
        onPathChange(truncated);
        return;
      }

      // 3. Check orthogonal adjacency to current head
      const dr = Math.abs(r - lastR);
      const dc = Math.abs(c - lastC);
      if (dr + dc !== 1) {
        // Not adjacent
        return;
      }

      // 4. Blocked obstacle tile check
      if (blockedSet.has(`${r},${c}`)) {
        PathFinderAudioService.playBlocked();
        if (onTileBlocked) {
          onTileBlocked(`Tile [${r + 1}, ${c + 1}] is blocked.`);
        }
        return;
      }

      // 5. Valid step forward!
      PathFinderAudioService.playStep();
      const nextPath = [...currentPath, [r, c]];
      onPathChange(nextPath);
    },
    [isLocked, onPathChange, path, gridSize, startR, startC, blockedSet, pathIndexMap, onTileBlocked]
  );

  /**
   * PanResponder for smooth drag / swipe drawing across tiles
   * Prevents accidental screen scrolling while dragging.
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isLocked,
      onMoveShouldSetPanResponder: () => !isLocked,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const col = Math.floor(locationX / tileSize);
        const row = Math.floor(locationY / tileSize);
        handleTileInteraction(row, col);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const col = Math.floor(locationX / tileSize);
        const row = Math.floor(locationY / tileSize);
        handleTileInteraction(row, col);
      },
    })
  ).current;

  // Render Grid rows and cells
  const rows = [];
  for (let r = 0; r < gridSize; r++) {
    const cols = [];
    for (let c = 0; c < gridSize; c++) {
      const coordKey = `${r},${c}`;
      const isStart = r === startR && c === startC;
      const isFinish = r === finishR && c === finishC;
      const isBlocked = blockedSet.has(coordKey);
      const isTrap = trapSet.has(coordKey);
      const numberVal = numberMap.get(coordKey);
      const keyObj = keyMap.get(coordKey);

      const pathIdx = pathIndexMap.get(coordKey);
      const isInPath = pathIdx !== undefined;
      const isHead = isInPath && pathIdx === path.length - 1;

      // Connecting indicators to previous step in path
      let connectedTop = false;
      let connectedBottom = false;
      let connectedLeft = false;
      let connectedRight = false;
      if (isInPath && path) {
        if (pathIdx > 0) {
          const prev = path[pathIdx - 1];
          if (prev[0] === r - 1 && prev[1] === c) connectedTop = true;
          if (prev[0] === r + 1 && prev[1] === c) connectedBottom = true;
          if (prev[0] === r && prev[1] === c - 1) connectedLeft = true;
          if (prev[0] === r && prev[1] === c + 1) connectedRight = true;
        }
        if (pathIdx < path.length - 1) {
          const nxt = path[pathIdx + 1];
          if (nxt[0] === r - 1 && nxt[1] === c) connectedTop = true;
          if (nxt[0] === r + 1 && nxt[1] === c) connectedBottom = true;
          if (nxt[0] === r && nxt[1] === c - 1) connectedLeft = true;
          if (nxt[0] === r && nxt[1] === c + 1) connectedRight = true;
        }
      }

      cols.push(
        <TouchableOpacity
          key={`cell_${r}_${c}`}
          activeOpacity={0.85}
          onPress={() => handleTileInteraction(r, c)}
          disabled={isLocked}
          style={[
            styles.cell,
            { width: tileSize, height: tileSize },
            isBlocked && styles.cellBlocked,
            isTrap && styles.cellTrap,
            isStart && styles.cellStart,
            isFinish && styles.cellFinish,
            isInPath && !isStart && !isFinish && styles.cellInPath,
            isHead && styles.cellHead,
          ]}
        >
          {/* Connector lines inside cell */}
          {connectedTop && <View style={[styles.connector, styles.connTop]} />}
          {connectedBottom && <View style={[styles.connector, styles.connBottom]} />}
          {connectedLeft && <View style={[styles.connector, styles.connLeft]} />}
          {connectedRight && <View style={[styles.connector, styles.connRight]} />}

          {/* Special Cell Badges / Content */}
          {isStart ? (
            <View style={styles.startBadge}>
              <Text style={styles.startText}>S</Text>
            </View>
          ) : isFinish ? (
            <View style={styles.finishBadge}>
              <Text style={styles.finishText}>F</Text>
              <Ionicons name="flag" size={tileSize > 42 ? 14 : 10} color="#000" />
            </View>
          ) : isBlocked ? (
            <View style={styles.blockedBadge}>
              <Ionicons name="close" size={tileSize > 42 ? 22 : 16} color="#EF4444" />
            </View>
          ) : isTrap ? (
            <View style={styles.trapBadge}>
              <Ionicons name="warning" size={tileSize > 42 ? 18 : 12} color="#f43f5e" />
            </View>
          ) : numberVal !== undefined ? (
            <View
              style={[
                styles.numberBadge,
                isInPath && styles.numberBadgeVisited,
                { width: tileSize * 0.58, height: tileSize * 0.58 },
              ]}
            >
              <Text style={[styles.numberText, isInPath && styles.numberTextVisited]}>
                {numberVal}
              </Text>
            </View>
          ) : keyObj !== undefined ? (
            <View
              style={[
                styles.keyBadge,
                isInPath && styles.keyBadgeVisited,
                { width: tileSize * 0.62, height: tileSize * 0.62 },
              ]}
            >
              <Ionicons
                name="key"
                size={tileSize > 42 ? 16 : 11}
                color={isInPath ? '#000' : '#FFD700'}
              />
              <Text style={[styles.keySymbol, isInPath && styles.keySymbolVisited]}>
                {keyObj.symbol}
              </Text>
            </View>
          ) : isInPath ? (
            <View style={styles.pathDot}>
              <Text style={styles.stepIndexText}>{pathIdx + 1}</Text>
            </View>
          ) : null}

          {/* Active Head Pulse Indicator */}
          {isHead && (
            <View style={styles.headBeacon}>
              <View style={styles.headBeaconDot} />
            </View>
          )}
        </TouchableOpacity>
      );
    }

    rows.push(
      <View key={`row_${r}`} style={styles.row}>
        {cols}
      </View>
    );
  }

  return (
    <View
      ref={gridContainerRef}
      style={[
        styles.gridWrapper,
        { width: actualGridSize, height: actualGridSize },
        Platform.OS === 'web' ? { touchAction: 'none', userSelect: 'none' } : null,
      ]}
      {...panResponder.panHandlers}
    >
      {rows}
    </View>
  );
};

const styles = StyleSheet.create({
  gridWrapper: {
    backgroundColor: '#090d0a',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#1e2e21',
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: '#39FF14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderWidth: 0.75,
    borderColor: '#172218',
    backgroundColor: '#0c140d',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cellStart: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    borderColor: '#10b981',
  },
  cellFinish: {
    backgroundColor: 'rgba(255, 215, 0, 0.22)',
    borderColor: '#FFD700',
  },
  cellBlocked: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cellTrap: {
    backgroundColor: 'rgba(244, 63, 94, 0.14)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  cellInPath: {
    backgroundColor: 'rgba(57, 255, 20, 0.18)',
    borderColor: 'rgba(57, 255, 20, 0.55)',
  },
  cellHead: {
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.32)',
  },

  // Path Connectors
  connector: {
    position: 'absolute',
    backgroundColor: '#39FF14',
    zIndex: 1,
  },
  connTop: {
    top: 0,
    left: '42%',
    right: '42%',
    height: '50%',
  },
  connBottom: {
    bottom: 0,
    left: '42%',
    right: '42%',
    height: '50%',
  },
  connLeft: {
    left: 0,
    top: '42%',
    bottom: '42%',
    width: '50%',
  },
  connRight: {
    right: 0,
    top: '42%',
    bottom: '42%',
    width: '50%',
  },

  // Badges
  startBadge: {
    width: '74%',
    height: '74%',
    borderRadius: 8,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#10b981',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  startText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  finishBadge: {
    width: '74%',
    height: '74%',
    borderRadius: 8,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 2,
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  finishText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    marginRight: 2,
  },
  blockedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  trapBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  numberBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(0, 229, 255, 0.16)',
    borderWidth: 1.5,
    borderColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  numberBadgeVisited: {
    backgroundColor: '#00E5FF',
    borderColor: '#fff',
  },
  numberText: {
    color: '#00E5FF',
    fontWeight: '900',
    fontSize: 12,
  },
  numberTextVisited: {
    color: '#000',
  },
  keyBadge: {
    borderRadius: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    borderWidth: 1.5,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    zIndex: 2,
  },
  keyBadgeVisited: {
    backgroundColor: '#FFD700',
  },
  keySymbol: {
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 10,
    marginLeft: 1,
  },
  keySymbolVisited: {
    color: '#000',
  },
  pathDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(57, 255, 20, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stepIndexText: {
    color: '#39FF14',
    fontSize: 9,
    fontWeight: '800',
  },
  headBeacon: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#39FF14',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  headBeaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#39FF14',
    shadowColor: '#39FF14',
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
});

