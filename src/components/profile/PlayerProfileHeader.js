import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { ImageUploadService } from '../../services/imageUploadService';
import { useAuth } from '../../context/AuthContext';

/**
 * Gets 2-letter uppercase initials from name
 */
function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (name.substring(0, 2) || 'SP').toUpperCase();
}

export const PlayerProfileHeader = ({ onProfileUpdated }) => {
  const { user, updateProfile } = useAuth();

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Upload state
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [selectedMimeType, setSelectedMimeType] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Edit profile state
  const [editName, setEditName] = useState(user?.name || '');
  const [editGamerTag, setEditGamerTag] = useState(user?.gamerTag || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState(null);

  // Image load error fallback
  const [imageError, setImageError] = useState(false);

  // Slow ring rotation & glow pulse animation
  const ringRotateAnim = useRef(new Animated.Value(0)).current;
  const glowPulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Loop slow ring rotation
    Animated.loop(
      Animated.timing(ringRotateAnim, {
        toValue: 1,
        duration: 16000,
        useNativeDriver: true,
      })
    ).start();

    // Loop soft breathing glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulseAnim, {
          toValue: 0.85,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulseAnim, {
          toValue: 0.4,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [ringRotateAnim, glowPulseAnim]);

  // Load user profile picture from safe storage on mount or change
  const [profilePicUri, setProfilePicUri] = useState(user?.profilePicture || null);

  useEffect(() => {
    let isMounted = true;
    async function loadPic() {
      if (user?.id) {
        const pic = await ImageUploadService.getUserProfilePicture(user.id);
        if (isMounted) {
          setProfilePicUri(pic || user?.profilePicture || null);
          setImageError(false);
        }
      }
    }
    loadPic();
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.profilePicture]);

  // Hidden web file input ref
  const fileInputRef = useRef(null);

  // Trigger file picker
  const handleOpenPicker = () => {
    setUploadError(null);
    setUploadSuccess(false);

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      Alert.alert(
        'Upload Profile Photo',
        'Image upload is available via browser or mobile gallery selector.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle file selection from web file input
  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Client-side MIME check
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadError(`Unsupported file format (${file.type}). Permitted formats: JPEG, PNG, WebP.`);
      setIsUploadModalOpen(true);
      return;
    }

    if (file.size > ImageUploadService.MAX_SIZE_BYTES) {
      setUploadError(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 3MB limit. Please select a smaller photo.`
      );
      setIsUploadModalOpen(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setSelectedImagePreview(dataUrl);
      setSelectedMimeType(file.type);
      setUploadError(null);
      setIsUploadModalOpen(true);
    };
    reader.onerror = () => {
      setUploadError('Failed to read selected image file.');
      setIsUploadModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting same file fires change event
    event.target.value = '';
  };

  // Confirm image upload
  const handleConfirmUpload = async () => {
    if (!selectedImagePreview || !user?.id) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await ImageUploadService.saveUserProfilePicture(
        user.id,
        selectedImagePreview,
        selectedMimeType
      );

      if (res.success) {
        setUploadSuccess(true);
        setProfilePicUri(res.dataUrl);
        setImageError(false);

        // Update auth user profile picture
        await updateProfile({ profilePicture: res.dataUrl });

        if (onProfileUpdated) onProfileUpdated();

        setTimeout(() => {
          setIsUploading(false);
          setIsUploadModalOpen(false);
          setSelectedImagePreview(null);
          setUploadSuccess(false);
        }, 800);
      } else {
        setIsUploading(false);
        setUploadError(res.error || 'Failed to validate and save profile picture.');
      }
    } catch (err) {
      setIsUploading(false);
      setUploadError(err.message || 'Error occurred while saving profile picture.');
    }
  };

  // Cancel image upload
  const handleCancelUpload = () => {
    setSelectedImagePreview(null);
    setUploadError(null);
    setIsUploadModalOpen(false);
  };

  // Open Edit Profile Modal
  const handleOpenEditModal = () => {
    setEditName(user?.name || '');
    setEditGamerTag(user?.gamerTag || `SOLO_${user?.name?.toUpperCase() || 'PLAYER'}#2099`);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // Save Profile Updates (Name & Gamer Tag)
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setEditError('Player name cannot be empty.');
      return;
    }
    if (!editGamerTag.trim()) {
      setEditError('Gamer tag cannot be empty.');
      return;
    }

    setIsSavingProfile(true);
    setEditError(null);

    try {
      const res = await updateProfile({
        name: editName.trim(),
        gamerTag: editGamerTag.trim().toUpperCase(),
      });

      if (res.success) {
        setIsSavingProfile(false);
        setIsEditModalOpen(false);
        if (onProfileUpdated) onProfileUpdated();
      } else {
        setIsSavingProfile(false);
        setEditError(res.error || 'Failed to update profile.');
      }
    } catch (err) {
      setIsSavingProfile(false);
      setEditError(err.message || 'Error saving profile.');
    }
  };

  const playerName = user?.name || 'SoloSlayer';
  const playerEmail = user?.email || 'gamer@gmail.com';
  const gamerTag = user?.gamerTag || 'SOLO_SLAYER#2099';

  const ringInterpolation = ringRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Hidden Web File Input for secure image picking */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}

      {/* 1. Large Circular Profile Picture with Futuristic Neon-Green & Burnt-Orange Ring */}
      <View style={styles.avatarOuterContainer}>
        {/* Breathing Green Ambient Glow behind avatar */}
        <Animated.View
          style={[
            styles.ambientAvatarGlow,
            {
              opacity: glowPulseAnim,
            },
          ]}
        />

        {/* Rotating Outer Ring with Orange Accent Segment */}
        <Animated.View
          style={[
            styles.avatarRingRotating,
            {
              transform: [{ rotate: ringInterpolation }],
            },
          ]}
        >
          {/* Neon Green Outer Border */}
          <View style={styles.ringGreenBorder} />
          {/* Burnt Orange Accent Segment on top quadrant */}
          <View style={styles.ringOrangeAccentSegment} />
        </Animated.View>

        {/* Circular Avatar Surface */}
        <TouchableOpacity
          style={styles.avatarTouchable}
          activeOpacity={0.88}
          onPress={handleOpenPicker}
          accessibilityLabel="Change profile picture"
        >
          {profilePicUri && !imageError ? (
            <Image
              source={{ uri: profilePicUri }}
              style={styles.avatarImage}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          ) : (
            // Stylish Gaming Initials Fallback Avatar (Never Broken)
            <View style={styles.initialsAvatar}>
              <View style={styles.initialsInnerBadge}>
                <Ionicons name="game-controller" size={28} color={colors.primary} style={{ marginBottom: 4 }} />
                <Text style={styles.initialsText}>{getInitials(playerName)}</Text>
              </View>
            </View>
          )}

          {/* Camera / Edit Icon Overlay */}
          <View style={styles.cameraIconBadge}>
            <Ionicons name="camera" size={16} color="#050705" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. Vertically Centered Profile Text Hierarchy */}
      <View style={styles.profileTextHierarchy}>
        <Text style={styles.profileEyebrow}>PLAYER PROFILE // ONLINE</Text>
        <Text style={styles.playerNameText}>{playerName}</Text>
        <Text style={styles.playerEmailText}>{playerEmail}</Text>

        <View style={styles.tagLevelRow}>
          <Text style={styles.gamerTagText}>{gamerTag}</Text>
          <Text style={styles.tagDividerDot}>·</Text>
          <View style={styles.proBadgeWrap}>
            <Text style={styles.proBadgeText}>{user?.badge || 'PRO SLAYER'}</Text>
          </View>
        </View>
      </View>

      {/* 3. Actions Row: Edit Profile & Change Photo */}
      <View style={styles.profileActionsRow}>
        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={handleOpenEditModal}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.actionBtnTextSecondary}>EDIT PROFILE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={handleOpenPicker}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-upload-outline" size={16} color="#050705" style={{ marginRight: 6 }} />
          <Text style={styles.actionBtnTextPrimary}>UPLOAD PHOTO</Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================= */}
      {/* MODAL: IMAGE UPLOAD, PREVIEW & CONFIRMATION               */}
      {/* ========================================================= */}
      <Modal
        visible={isUploadModalOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCancelUpload}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIconWrap}>
                <Ionicons name="image-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>UPDATE PROFILE PICTURE</Text>
              <TouchableOpacity onPress={handleCancelUpload} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {uploadError ? (
              <View style={styles.errorNotice}>
                <Ionicons name="alert-circle" size={18} color={colors.error} style={{ marginRight: 8 }} />
                <Text style={styles.errorNoticeText}>{uploadError}</Text>
              </View>
            ) : null}

            {selectedImagePreview ? (
              <View style={styles.previewContainer}>
                <Text style={styles.previewSubtitle}>Previewing Circular Crop:</Text>
                <View style={styles.previewRingWrap}>
                  <Image source={{ uri: selectedImagePreview }} style={styles.previewCircularImage} />
                </View>
                <Text style={styles.previewFormatText}>
                  Format: {selectedMimeType ? selectedMimeType.replace('image/', '').toUpperCase() : 'VALIDATED'} • Secure Safe Key
                </Text>
              </View>
            ) : (
              <View style={styles.pickerDropArea}>
                <Ionicons name="cloud-upload" size={44} color={colors.primary} style={{ marginBottom: 10 }} />
                <Text style={styles.pickerDropTitle}>Choose an image file</Text>
                <Text style={styles.pickerDropSubtitle}>JPEG, PNG, or WebP up to 3MB</Text>
                <TouchableOpacity style={styles.browseBtn} onPress={handleOpenPicker}>
                  <Text style={styles.browseBtnText}>Browse Files</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Modal Actions */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={handleCancelUpload}
                disabled={isUploading}
              >
                <Text style={styles.modalCancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              {selectedImagePreview && (
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, isUploading && styles.modalBtnDisabled]}
                  onPress={handleConfirmUpload}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#050705" />
                  ) : uploadSuccess ? (
                    <Text style={styles.modalConfirmBtnText}>SAVED ✓</Text>
                  ) : (
                    <Text style={styles.modalConfirmBtnText}>SAVE PICTURE</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: EDIT PROFILE (NAME & GAMER TAG)                    */}
      {/* ========================================================= */}
      <Modal
        visible={isEditModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIconWrap}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>EDIT PLAYER PROFILE</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {editError && (
              <View style={styles.errorNotice}>
                <Ionicons name="alert-circle" size={18} color={colors.error} style={{ marginRight: 8 }} />
                <Text style={styles.errorNoticeText}>{editError}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PLAYER FULL NAME</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textPlaceholder}
                maxLength={40}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>GAMER TAG</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editGamerTag}
                onChangeText={setEditGamerTag}
                placeholder="e.g. CYBER_WARRIOR#2099"
                placeholderTextColor={colors.textPlaceholder}
                autoCapitalize="characters"
                maxLength={25}
              />
              <Text style={styles.inputHint}>Displayed in leaderboards, quests, and multiplayer rooms.</Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setIsEditModalOpen(false)}
                disabled={isSavingProfile}
              >
                <Text style={styles.modalCancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, isSavingProfile && styles.modalBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <ActivityIndicator size="small" color="#050705" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>SAVE CHANGES</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  avatarOuterContainer: {
    width: 154,
    height: 154,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  ambientAvatarGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(57, 255, 20, 0.22)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 28,
  },
  avatarRingRotating: {
    position: 'absolute',
    width: 154,
    height: 154,
    borderRadius: 77,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringGreenBorder: {
    position: 'absolute',
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 2.5,
    borderColor: colors.primary,
    opacity: 0.85,
  },
  ringOrangeAccentSegment: {
    position: 'absolute',
    top: -2,
    width: 70,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.burntOrange,
    shadowColor: colors.burntOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  avatarTouchable: {
    width: 138,
    height: 138,
    borderRadius: 69,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(57, 255, 20, 0.4)',
  },
  avatarImage: {
    width: 138,
    height: 138,
    borderRadius: 69,
  },
  initialsAvatar: {
    width: 138,
    height: 138,
    borderRadius: 69,
    backgroundColor: '#0A150D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsInnerBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.primaryText,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : undefined,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#050705',
  },
  profileTextHierarchy: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  playerNameText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primaryText,
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Space Grotesk, sans-serif' : undefined,
  },
  playerEmailText: {
    fontSize: 13,
    color: colors.secondaryText,
    letterSpacing: 0.3,
    marginBottom: 10,
    textAlign: 'center',
  },
  tagLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  gamerTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.8,
  },
  tagDividerDot: {
    fontSize: 14,
    color: colors.mutedText,
  },
  levelBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.35)',
  },
  levelBadgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.mutedText,
    marginRight: 4,
    letterSpacing: 0.5,
  },
  levelBadgeValue: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  proBadgeWrap: {
    backgroundColor: 'rgba(255, 106, 0, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 106, 0, 0.4)',
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.warmOrange,
    letterSpacing: 0.8,
  },
  profileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevatedSurface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.28)',
  },
  actionBtnTextSecondary: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: 0.5,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  actionBtnTextPrimary: {
    fontSize: 12,
    fontWeight: '800',
    color: '#050705',
    letterSpacing: 0.5,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 5, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.3)',
    padding: 22,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modalHeaderIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(57, 255, 20, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: 0.5,
  },
  errorNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.12)',
    borderWidth: 1,
    borderColor: colors.error,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorNoticeText: {
    flex: 1,
    fontSize: 12,
    color: colors.error,
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  previewSubtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 10,
  },
  previewRingWrap: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: colors.primary,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
    marginBottom: 12,
  },
  previewCircularImage: {
    width: 130,
    height: 130,
  },
  previewFormatText: {
    fontSize: 11,
    color: colors.mutedText,
  },
  pickerDropArea: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(57, 255, 20, 0.35)',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21, 30, 24, 0.5)',
    marginVertical: 14,
  },
  pickerDropTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 4,
  },
  pickerDropSubtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 14,
  },
  browseBtn: {
    backgroundColor: colors.elevatedSurface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  browseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.mutedText,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalTextInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 20, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.primaryText,
    fontSize: 14,
  },
  inputHint: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 4,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.elevatedSurface,
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondaryText,
  },
  modalConfirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  modalBtnDisabled: {
    opacity: 0.6,
  },
  modalConfirmBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#050705',
    letterSpacing: 0.5,
  },
});
