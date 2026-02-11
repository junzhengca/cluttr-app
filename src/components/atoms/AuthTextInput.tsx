import React, { memo, useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { Ionicons } from '@expo/vector-icons';
import type { StyledProps } from '../../utils/styledComponents';

const InputContainer = styled(View) <{ hasError: boolean; isFocused: boolean }>`
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }: StyledProps) => theme.colors.surface};
  border-width: ${({ isFocused }: { isFocused: boolean }) => isFocused ? '2px' : '1px'};
  border-color: ${({ theme, hasError, isFocused }: StyledProps & { hasError: boolean; isFocused: boolean }) =>
        hasError
            ? theme.colors.error
            : isFocused
                ? theme.colors.primary
                : theme.colors.borderLight};
  border-radius: ${({ theme }: StyledProps) => theme.borderRadius.md}px;
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.md}px;
  height: 52px;
`;

const IconWrapper = styled(View)`
  width: 24px;
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }: StyledProps) => theme.spacing.sm}px;
`;

const StyledTextInput = styled(TextInput)`
  flex: 1;
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.md}px;
  color: ${({ theme }: StyledProps) => theme.colors.text};
  padding-vertical: 0;
`;

const ToggleButton = styled(TouchableOpacity)`
  padding: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const ErrorContainer = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-top: ${({ theme }: StyledProps) => theme.spacing.xs}px;
  padding-horizontal: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const ErrorIconSmall = styled(View)`
  margin-right: ${({ theme }: StyledProps) => theme.spacing.xs}px;
`;

const ErrorText = styled.Text`
  font-size: ${({ theme }: StyledProps) => theme.typography.fontSize.sm}px;
  color: ${({ theme }: StyledProps) => theme.colors.error};
  flex: 1;
`;

export interface AuthTextInputProps {
    icon: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    error?: boolean;
    errorMessage?: string;
    onSubmitEditing?: () => void;
    returnKeyType?: 'done' | 'next' | 'go';
}

export const AuthTextInput = memo(
    React.forwardRef<TextInput, AuthTextInputProps>(
        (
            {
                icon,
                placeholder,
                value,
                onChangeText,
                secureTextEntry = false,
                keyboardType = 'default',
                autoCapitalize = 'none',
                error = false,
                errorMessage,
                onSubmitEditing,
                returnKeyType,
            },
            ref,
        ) => {
            const [isFocused, setIsFocused] = useState(false);
            const [isPasswordVisible, setIsPasswordVisible] = useState(false);

            return (
                <View>
                    <InputContainer hasError={error} isFocused={isFocused}>
                        <IconWrapper>
                            <Ionicons
                                name={icon}
                                size={20}
                                color={error ? '#EF5350' : isFocused ? undefined : '#9E9E9E'}
                            />
                        </IconWrapper>
                        <StyledTextInput
                            ref={ref}
                            placeholder={placeholder}
                            value={value}
                            onChangeText={onChangeText}
                            secureTextEntry={secureTextEntry && !isPasswordVisible}
                            keyboardType={keyboardType}
                            autoCapitalize={autoCapitalize}
                            autoCorrect={false}
                            spellCheck={false}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onSubmitEditing={onSubmitEditing}
                            returnKeyType={returnKeyType}
                            placeholderTextColor="#9E9E9E"
                        />
                        {secureTextEntry && (
                            <ToggleButton onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                <Ionicons
                                    name={isPasswordVisible ? 'eye' : 'eye-off'}
                                    size={20}
                                    color="#9E9E9E"
                                />
                            </ToggleButton>
                        )}
                    </InputContainer>
                    {error && errorMessage && (
                        <ErrorContainer>
                            <ErrorIconSmall>
                                <Ionicons name="warning" size={14} color="#EF5350" />
                            </ErrorIconSmall>
                            <ErrorText>{errorMessage}</ErrorText>
                        </ErrorContainer>
                    )}
                </View>
            );
        },
    ),
);

AuthTextInput.displayName = 'AuthTextInput';
