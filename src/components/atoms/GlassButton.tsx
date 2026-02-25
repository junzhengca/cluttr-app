import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { StyledProps } from '../../utils/styledComponents';

interface GlassButtonProps {
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    text?: string;
    tintColor?: string;
    textColor?: string;
    style?: StyleProp<ViewStyle>;
    disabled?: boolean;
    loading?: boolean;
}

const StyledGlassView = styled(GlassView)`
  border-radius: 20px;
`;

const ContentContainer = styled(TouchableOpacity) <{ hasText: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-horizontal: ${(props: StyledProps & { hasText: boolean }) =>
        props.hasText ? props.theme.spacing.md : 0}px;
  height: 40px;
  min-width: 40px;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
`;

const ButtonText = styled(Text) <{ tintColor?: string }>`
  font-size: ${(props: StyledProps) => props.theme.typography.fontSize.md}px;
  font-weight: ${(props: StyledProps) => props.theme.typography.fontWeight.medium};
  color: ${(props: StyledProps & { tintColor?: string }) =>
        props.tintColor || props.theme.colors.text};
  margin-left: ${(props: StyledProps) => props.theme.spacing.xs}px;
`;

export const GlassButton: React.FC<GlassButtonProps> = ({
    onPress,
    icon,
    text,
    tintColor,
    textColor,
    style,
    disabled,
    loading
}) => {
    const theme = useTheme();
    const iconColor = textColor || tintColor || theme.colors.text;

    return (
        <View style={style}>
            <StyledGlassView
                key={theme.colors.background} // Force re-render on theme change
                glassEffectStyle={'regular'}
                isInteractive={true}
                tintColor={tintColor}
            >
                <ContentContainer
                    onPress={onPress}
                    disabled={disabled || loading}
                    hasText={!!text}
                    activeOpacity={0.7}
                >
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: loading ? 0 : 1,
                    }}>
                        {icon && (
                            <Ionicons
                                name={icon}
                                size={20}
                                color={iconColor}
                                style={text ? { marginRight: 4 } : {}}
                            />
                        )}
                        {text && (
                            <ButtonText tintColor={textColor}>
                                {text}
                            </ButtonText>
                        )}
                    </View>
                    {loading && (
                        <View style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            <ActivityIndicator size="small" color={iconColor} />
                        </View>
                    )}
                </ContentContainer>
            </StyledGlassView>
        </View>
    );
};
