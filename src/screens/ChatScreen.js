import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

const ChatScreen = ({ route, navigation }) => {
  const { bookingId, peerName, topic } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfileName, setCurrentProfileName] = useState('User');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    initChat();

    // Set up Realtime subscription for instant messaging
    const channel = supabase
      .channel(`room_${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const initChat = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.full_name) {
          setCurrentProfileName(profile.full_name);
        }
      }

      // Fetch message history
      const { data, error } = await supabase
        .from('booking_messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading chat:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentUser) return;

    const messageToSend = inputText.trim();
    setInputText('');

    try {
      const { error } = await supabase.from('booking_messages').insert({
        booking_id: bookingId,
        sender_id: currentUser.id,
        sender_name: currentProfileName,
        message: messageToSend,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender_id === currentUser?.id;

    return (
      <View style={[styles.msgRow, isMe ? styles.rowMe : styles.rowOther]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>{item.sender_name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {!isMe && <Text style={styles.senderName}>{item.sender_name}</Text>}
          <Text style={[styles.msgText, isMe ? styles.textMe : styles.textOther]}>
            {item.message}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header Banner */}
      <View style={styles.chatHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatWith}>Chat with {peerName}</Text>
          <Text style={styles.chatTopic} numberOfLines={1}>Topic: {topic}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyChatText}>No messages yet. Start the conversation about your session!</Text>
            </View>
          }
        />
      )}

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Ionicons name="send" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  chatWith: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  chatTopic: { fontSize: 11, color: '#64748b', marginTop: 2 },
  msgList: { padding: 16, gap: 10 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 },
  rowMe: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  msgAvatarText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 14 },
  bubbleMe: { backgroundColor: '#7c3aed', borderBottomRightRadius: 2 },
  bubbleOther: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderBottomLeftRadius: 2 },
  senderName: { fontSize: 10, fontWeight: '700', color: '#7c3aed', marginBottom: 2 },
  msgText: { fontSize: 13, lineHeight: 18 },
  textMe: { color: '#fff' },
  textOther: { color: '#1e293b' },
  emptyChat: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyChatText: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    maxHeight: 90,
  },
  sendButton: {
    backgroundColor: '#7c3aed',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatScreen;