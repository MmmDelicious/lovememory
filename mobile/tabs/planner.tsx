import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Heart, 
  Star, 
  Clock,
  MapPin,
  X,
  Check
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, BounceIn } from 'react-native-reanimated';
import { getEvents as apiGetEvents, createEvent as apiCreateEvent } from '../services/event.service';

const { width: screenWidth } = Dimensions.get('window');

interface EventCardProps {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'date' | 'memory' | 'game' | 'other';
  description?: string;
  location?: string;
  delay: number;
}

function EventCard({ id, title, date, time, type, description, location, delay }: EventCardProps) {
  const getEventIcon = () => {
    switch (type) {
      case 'date':
        return <Heart size={16} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />;
      case 'memory':
        return <Star size={16} color="#FFFFFF" strokeWidth={2} />;
      case 'game':
        return <CalendarIcon size={16} color="#FFFFFF" strokeWidth={2} />;
      default:
        return <Clock size={16} color="#FFFFFF" strokeWidth={2} />;
    }
  };

  const getEventColor = () => {
    switch (type) {
      case 'date':
        return ['#D97A6C', '#E89F93'];
      case 'memory':
        return ['#E89F93', '#F0B8AF'];
      case 'game':
        return ['#C96A5C', '#D97A6C'];
      default:
        return ['#B8A8A4', '#C9BFBD'];
    }
  };

  return (
    <Animated.View entering={BounceIn.delay(delay)} style={styles.eventCard}>
      <TouchableOpacity>
          <LinearGradient
            colors={getEventColor() as [string, string]}
            style={styles.eventGradient}
          >
          <View style={styles.eventHeader}>
            <View style={styles.eventIcon}>
              {getEventIcon()}
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{title}</Text>
              <Text style={styles.eventDateTime}>{date} • {time}</Text>
            </View>
          </View>
          
          {description && (
            <Text style={styles.eventDescription}>{description}</Text>
          )}
          
          {location && (
            <View style={styles.eventLocation}>
              <MapPin size={12} color="rgba(255,255,255,0.8)" strokeWidth={2} />
              <Text style={styles.eventLocationText}>{location}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface CalendarDayProps {
  day: number;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
  onPress: () => void;
}

function CalendarDay({ day, isToday, isSelected, hasEvents, onPress }: CalendarDayProps) {
  return (
    <TouchableOpacity
      style={[
        styles.calendarDay,
        isToday && styles.calendarDayToday,
        isSelected && styles.calendarDaySelected,
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.calendarDayText,
        isToday && styles.calendarDayTextToday,
        isSelected && styles.calendarDayTextSelected,
      ]}>
        {day}
      </Text>
      {hasEvents && <View style={styles.eventDot} />}
    </TouchableOpacity>
  );
}

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (event: any) => void;
}

function AddEventModal({ visible, onClose, onSave }: AddEventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState<'date' | 'memory' | 'game' | 'other'>('other');

  const handleSave = () => {
    if (title.trim()) {
      onSave({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        type: eventType,
      });
      setTitle('');
      setDescription('');
      setLocation('');
      setEventType('other');
      onClose();
    }
  };

  const eventTypes = [
    { key: 'date', label: 'Свидание', icon: <Heart size={16} color="#D97A6C" strokeWidth={2} /> },
    { key: 'memory', label: 'Воспоминание', icon: <Star size={16} color="#D97A6C" strokeWidth={2} /> },
    { key: 'game', label: 'Игра', icon: <CalendarIcon size={16} color="#D97A6C" strokeWidth={2} /> },
    { key: 'other', label: 'Другое', icon: <Clock size={16} color="#D97A6C" strokeWidth={2} /> },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#FFFFFF', '#FFF8F6']}
            style={styles.modalGradient}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Новое событие</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <X size={24} color="#8C7F7D" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Название</Text>
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Введите название события"
                  placeholderTextColor="#B8A8A4"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Описание</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Добавьте описание (необязательно)"
                  placeholderTextColor="#B8A8A4"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Место</Text>
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Где это произойдет?"
                  placeholderTextColor="#B8A8A4"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Тип события</Text>
                <View style={styles.eventTypeGrid}>
                  {eventTypes.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.eventTypeButton,
                        eventType === type.key && styles.eventTypeButtonSelected
                      ]}
                      onPress={() => setEventType(type.key as any)}
                    >
                      {type.icon}
                      <Text style={[
                        styles.eventTypeText,
                        eventType === type.key && styles.eventTypeTextSelected
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <LinearGradient
                  colors={['#D97A6C', '#E89F93']}
                  style={styles.saveButtonGradient}
                >
                  <Check size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.saveButtonText}>Сохранить</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

type UiEvent = {
  id: string;
  title: string;
  date: string; // '15 янв'
  time: string; // '19:00'
  type: 'date' | 'memory' | 'game' | 'other';
  description?: string;
  location?: string;
  day: number; // numeric day for filtering
};

export default function PlannerScreen() {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState(now.getDate());
  const [showAddModal, setShowAddModal] = useState(false);
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const monthsShort = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  const monthsFull = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  const currentMonth = `${monthsFull[now.getMonth()]} ${now.getFullYear()}`;
  const daysInMonth = useMemo(() => {
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }, [now]);
  const today = now.getDate();

  const formatDate = (d: Date) => {
    const dd = d.getDate();
    const mm = monthsShort[d.getMonth()];
    const hh = `${d.getHours()}`.padStart(2, '0');
    const min = `${d.getMinutes()}`.padStart(2, '0');
    return { dateStr: `${dd} ${mm}`, timeStr: `${hh}:${min}`, day: dd };
  };

  const mapServerTypeToUi = (t?: string): UiEvent['type'] => {
    switch (t) {
      case 'date':
        return 'date';
      case 'memory':
      case 'anniversary':
      case 'milestone':
        return 'memory';
      default:
        return 'other';
    }
  };

  const mapUiTypeToServer = (t: UiEvent['type']): string => {
    switch (t) {
      case 'date':
        return 'date';
      case 'memory':
        return 'memory';
      case 'game':
        return 'plan';
      default:
        return 'plan';
    }
  };

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await apiGetEvents();
      const list = (res.data as any[]).map((e) => {
        const dt = new Date(e.event_date);
        const { dateStr, timeStr, day } = formatDate(dt);
        const ui: UiEvent = {
          id: e.id,
          title: e.title,
          description: e.description ?? undefined,
          type: mapServerTypeToUi(e.event_type),
          date: dateStr,
          time: timeStr,
          day,
        };
        return ui;
      });
      setEvents(list);
    } catch (e) {
      console.log('Failed to load events', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleAddEvent = async (newEvent: any) => {
    try {
      const baseDate = new Date(now.getFullYear(), now.getMonth(), selectedDate, 12, 0, 0);
      const payload = {
        title: newEvent.title,
        description: newEvent.description,
        event_date: baseDate.toISOString(),
        event_type: mapUiTypeToServer(newEvent.type as UiEvent['type']),
        isShared: false,
      };
      await apiCreateEvent(payload);
      await loadEvents();
    } catch (e) {
      console.log('Failed to create event', e);
    }
  };

  const renderCalendar = () => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const hasEvents = events.some(event => event.day === i);
      days.push(
        <CalendarDay
          key={i}
          day={i}
          isToday={i === today}
          isSelected={i === selectedDate}
          hasEvents={hasEvents}
          onPress={() => setSelectedDate(i)}
        />
      );
    }
    return days;
  };

  const todayEvents = events.filter(event => event.day === selectedDate);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F6" />
      
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <Text style={styles.headerTitle}>Планер</Text>
        <Text style={styles.headerSubtitle}>Твои важные события</Text>
      </Animated.View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthTitle}>{currentMonth}</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.calendarCard}>
            <LinearGradient
              colors={['#FFFFFF', '#FFF8F6']}
              style={styles.calendarGradient}
            >
              <View style={styles.weekDays}>
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                  <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {renderCalendar()}
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Events for Selected Date */}
        <View style={styles.eventsContainer}>
          <Text style={styles.sectionTitle}>
            События на {selectedDate} января
          </Text>
          
            {loading ? (
            <Animated.View entering={FadeInUp.delay(400)} style={styles.noEventsCard}>
              <LinearGradient
                colors={['#FFFFFF', '#FFF8F6']}
                style={styles.noEventsGradient}
              >
                <View />
                <Text style={styles.noEventsTitle}>Загрузка событий...</Text>
              </LinearGradient>
            </Animated.View>
          ) : todayEvents.length > 0 ? (
            todayEvents.map((event, index) => (
              <EventCard
                key={event.id}
                {...event}
                delay={400 + index * 100}
              />
            ))
          ) : (
            <Animated.View entering={FadeInUp.delay(400)} style={styles.noEventsCard}>
              <LinearGradient
                colors={['#FFFFFF', '#FFF8F6']}
                style={styles.noEventsGradient}
              >
                <CalendarIcon size={32} color="#B8A8A4" strokeWidth={1.5} />
                <Text style={styles.noEventsTitle}>Нет событий</Text>
                <Text style={styles.noEventsText}>
                  На этот день пока ничего не запланировано
                </Text>
                <TouchableOpacity 
                  style={styles.addEventButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Text style={styles.addEventButtonText}>Добавить событие</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}
        </View>

        {/* Upcoming Events */}
        <Animated.View entering={FadeInUp.delay(600)} style={styles.upcomingContainer}>
          <Text style={styles.sectionTitle}>Ближайшие события</Text>
          {events.slice(0, 3).map((event, index) => (
            <EventCard
              key={event.id}
              {...event}
              delay={700 + index * 50}
            />
          ))}
        </Animated.View>
      </ScrollView>

      <AddEventModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddEvent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'System',
    fontWeight: '800',
    color: '#4A3F3D',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'System',
    color: '#8C7F7D',
    fontWeight: '400',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  calendarContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D97A6C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  calendarGradient: {
    padding: 20,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  weekDayText: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#8C7F7D',
    textAlign: 'center',
    width: 32,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  calendarDayToday: {
    backgroundColor: '#EADFD8',
  },
  calendarDaySelected: {
    backgroundColor: '#D97A6C',
  },
  calendarDayText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#4A3F3D',
  },
  calendarDayTextToday: {
    color: '#D97A6C',
    fontWeight: '600',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  eventDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D97A6C',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
    marginBottom: 16,
  },
  eventsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  eventCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventGradient: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  eventDateTime: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
  },
  eventDescription: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  eventLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocationText: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  noEventsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  noEventsGradient: {
    padding: 32,
    alignItems: 'center',
  },
  noEventsTitle: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#4A3F3D',
    marginTop: 12,
    marginBottom: 8,
  },
  noEventsText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#8C7F7D',
    textAlign: 'center',
    marginBottom: 16,
  },
  addEventButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D97A6C',
  },
  addEventButtonText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#D97A6C',
  },
  upcomingContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalGradient: {
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E9E8',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalForm: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#4A3F3D',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFF8F6',
    borderWidth: 1,
    borderColor: '#F2E9E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'System',
    color: '#4A3F3D',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  eventTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  eventTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2E9E8',
    backgroundColor: '#FFFFFF',
  },
  eventTypeButtonSelected: {
    borderColor: '#D97A6C',
    backgroundColor: '#EADFD8',
  },
  eventTypeText: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
    marginLeft: 6,
  },
  eventTypeTextSelected: {
    color: '#D97A6C',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2E9E8',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#8C7F7D',
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});