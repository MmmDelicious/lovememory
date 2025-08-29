import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Clock, 
  User, 
  ArrowLeft, 
  Trophy, 
  Target, 
  Zap, 
  Crown,
  Play,
  Settings,
  X,
  Check
} from 'lucide-react-native';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  BounceIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  SlideInUp,
  SlideOutDown
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

// Словари для разных языков
const RUSSIAN_WORDS = [
  // Базовые слова (из оригинального словаря)
  'СЛОВО','ВРЕМЯ','ИГРА','ДОМА','ВОДА','РУКА','НОГА','ГЛАЗ','ДЕНЬ','НОЧЬ',
  'СТОЛ','СТУЛ','ОКНО','ДВЕРЬ','КНИГА','РУЧКА','ЛИСТ','ЦВЕТ','ЗВУК','СВЕТ',
  'МОРЕ','РЕКА','ГОРА','ЛЕТО','ЗИМА','ВЕСНА','ЛУНА','ЗВЕЗДА','ГОРОД','СЕЛО',
  
  // Расширенный словарь (только 5 букв)
  'АВТОР','АДРЕС','АКТЕР','АЛМАЗ','АРЕНА','АРХИВ','АСТРА','БАГАЖ','БАЛЕТ',
  'БАНАН','БАРДА','БАТОН','БЕГУН','БЕДРО','БЕЛКА','БЕРЕГ','БИЛЕТ','БИРЖА',
  'БИТВА','БЛОКА','БЛЮДО','БОГАТ','БОЖИЙ','БОКАЛ','БОМБА','БРАТЬ','БРЕМЯ',
  'БРИТЬ','БРОНЯ','БРЫЗГ','БУДКА','БУКВА','БУЛКА','БЫСТР','ВАГОН','ВАЖНО',
  'ВАЛЕТ','ВАЛУН','ВАРКА','ВЕДРО','ВЕЗТИ','ВЕКОВ','ВЕЛИК','ВЕНОК','ВЕРА',
  'ВЕРХА','ВЕСЕЛ','ВЕТЕР','ВЕТКА','ВЕЧЕР','ВЗРЫВ','ВИДЕТ','ВИЛКА','ВИНО',
  'ВИСЕТ','ВЛАСТ','ВНЕШН','ВНУТР','ВОДКА','ВОЙНА','ВОЛНА','ВОРОТ','ВОРОХ',
  'ВОСЕМ','ВОТКА','ВТОРО','ВХОД','ВЫБОР','ВЫСОК','ГАЗЕТ','ГАЛКА','ГАММА',
  'ГАРАЖ','ГВАРД','ГЕРОЙ','ГИБЕЛ','ГЛАВН','ГЛУБО','ГЛУП','ГНЕВ','ГОЛОВ',
  'ГОЛОС','ГОНКА','ГОРБА','ГОРДО','ГОРЛО','ГОРОХ','ГОСТЬ','ГРАД','ГРАМ',
  'ГРАЧ','ГРЕХ','ГРУДЬ','ГРУПП','ГРУСТ','ГРЯЗЬ','ДАВАТ','ДАВНО','ДАЖЕ',
  'ДАЛЕК','ДАМА','ДАНЬ','ДАТА','ДВЕРЬ','ДВИЖУ','ДВОЕ','ДВОР','ДЕВЯТ',
  'ДЕЖУР','ДЕЛАТ','ДЕЛО','ДЕНЬ','ДЕРЕВ','ДЕСЯТ','ДЕТСК','ДИВАН','ДЛИНН',
  'ДНЕМ','ДНЕВН','ДНО','ДОБРО','ДОВЕР','ДОГОВ','ДОЖДЬ','ДОЛГО','ДОЛЖН',
  'ДОМА','ДОМОЙ','ДОРОГ','ДОРОЖ','ДОСТА','ДОЧКА','ДРАКА','ДРЕВН','ДРУГ',
  'ДРУЖБ','ДУМА','ДУША','ДЫМ','ДЫРКА','ДЮЖИН','ЕВРОП','ЕГО','ЕДВА',
  'ЕДИН','ЕДУ','ЕЕ','ЕЖЕДН','ЕЗДИТ','ЕЛКА','ЕМУ','ЕСЛИ','ЕСТЬ',
  'ЕЩЕ','ЖАЛКО','ЖАРК','ЖАРКО','ЖДАТЬ','ЖЕЛЕЗ','ЖЕЛТ','ЖЕНА','ЖЕСТ',
  'ЖИВОЙ','ЖИВОТ','ЖИЗНЬ','ЖИЛОЙ','ЖИРН','ЖУРНА','ЗАБОТ','ЗАВТР','ЗАДАЧ',
  'ЗАДНИ','ЗАКОН','ЗАМЕТ','ЗАПАД','ЗАПАХ','ЗАРЯ','ЗАСЕД','ЗАХОД','ЗВЕЗД',
  'ЗВОН','ЗВУК','ЗДЕСЬ','ЗЕЛЕН','ЗЕМЛЯ','ЗИМА','ЗНАЧ','ЗОЛОТ','ЗРИТЕ',
  'ИБО','ИГРА','ИГРАТ','ИДЕЯ','ИДТИ','ИЗБА','ИЗВЕС','ИЗДАЛ','ИЗМЕН',
  'ИМЕНН','ИМЕТЬ','ИНОГД','ИНОЙ','ИНСТИ','ИСТИН','ИХ','КАБИН','КАЖДЫ',
  'КАЗАК','КАК','КАКОЙ','КАМЕН','КАМНЯ','КАПЛЯ','КАРТА','КАРТИ','КАТОК',
  'КВАРТ','КИНО','КЛАСС','КЛЮЧ','КНИГА','КНИЖК','КОГО','КОЖА','КОЛЕС',
  'КОЛХО','КОНЕЦ','КОНТР','КОПЕЙ','КОРЕН','КОРОВ','КОРОТ','КОСМО','КРАЙ',
  'КРАСН','КРЕПК','КРОВЬ','КРУГ','КРУПН','КРЫША','КУДА','КУКЛА','КУПИТ',
  'КУРС','ЛАГЕР','ЛАДОН','ЛАМПА','ЛЕВЫЙ','ЛЕГК','ЛЕГКО','ЛЕД','ЛЕЖАТ',
  'ЛЕС','ЛЕТО','ЛЕТЧИ','ЛИСТ','ЛИЦО','ЛОВИТ','ЛОЖКА','ЛОЖЬ','ЛОШАД',
  'ЛУГ','ЛУНА','ЛУЧШЕ','ЛЮБИТ','ЛЮДИ','МАГАЗ','МАЙОР','МАЛЕН','МАЛО',
  'МАЛЬЧ','МАМА','МАРКА','МАССА','МАТЬ','МЕЖДУ','МЕСТО','МЕТАЛ','МЕТРО',
  'МЕЧТА','МИЛЛИ','МИНУТ','МИР','МНОГО','МОДЕЛ','МОЖНО','МОРЕ','МОСКВ',
  'МОСТ','МОЩН','МУЖ','МУЖЧИ','МУЗЫК','МЫСЛЬ','НАБОР','НАВЕР','НАДО',
  'НАЗАД','НАИБО','НАРОД','НАСЕЛ','НАУКА','НАЧАЛ','НАЧАТ','НЕБО','НЕГО',
  'НЕДАВ','НЕКОТ','НЕМНО','НЕПОС','НЕСКО','НИЖЕ','НИКАК','НИКТО','НОВЫЙ',
  'НОГА','НОЧЬ','НОЧЬЮ','НУЖЕН','НУЖНО','ОБЛАС','ОБРАЗ','ОБЩЕС','ОБЩИЙ',
  'ОГОНЬ','ОДИН','ОДНАК','ОДНАЖ','ОЖИД','ОКНО','ОКРУГ','ОПЯТЬ','ОРГАН',
  'ОСЕНЬ','ОСНОВ','ОСТАЛ','ОТВЕТ','ОТЕЦ','ОТКРЫ','ОТЛИЧ','ОТНОС','ОТРЯД',
  'ОТЦОВ','ОХОТА','ОЧЕНЬ','ОЧКИ','ПАМЯТ','ПАПА','ПАРТИ','ПАРУС','ПАХНУ',
  'ПЕРЕД','ПЕСНЯ','ПЕСОК','ПЕТР','ПИОНЕР','ПИСАТ','ПИСЬМ','ПЛАН','ПЛАТЬ',
  'ПЛЕЧО','ПЛОХ','ПЛОЩА','ПОБЕД','ПОВЕР','ПОГИБ','ПОДОБ','ПОЕЗД','ПОЖАР',
  'ПОЗВО','ПОКА','ПОКУП','ПОЛЕ','ПОЛИЦ','ПОЛК','ПОЛНО','ПОЛОЖ','ПОЛУЧ',
  'ПОМОЩ','ПОНЯТ','ПОПУЛ','ПОРЯД','ПОСЛЕ','ПОСТА','ПОТОМ','ПОХОД','ПОЧТА',
  'ПОЧТИ','ПРАВД','ПРАВО','ПРЕДС','ПРЕЖД','ПРИЕМ','ПРИМ','ПРОБЛ','ПРОСТ',
  'ПРОЦЕ','ПРЯМ','ПУТЬ','ПЯТЬ','РАБОТ','РАВЕН','РАДИО','РАЗВЕ','РАЗН',
  'РАНЕН','РАСПО','РАССМ','РЕБЯТ','РЕВОЛ','РЕДКО','РЕЖИМ','РЕКА','РЕМОН',
  'РЕСПУ','РЕШИТ','РОДИН','РОДНО','РОЖДЕ','РОМАН','РУБЛЬ','РУКА','РУССК',
  'РЫНОК','РЯДОМ','САМОЛ','САМЫЙ','СВЕТ','СВЕТЛ','СВОБОД','СВОЙ','СВЯЗЬ',
  'СЕГОД','СЕДЬМ','СЕЙЧАС','СЕМЬ','СЕМЬЯ','СЕРДЦ','СЕРЬЕ','СИЛА','СИЛЬН',
  'СИСТЕ','СКАЗА','СКОРО','СЛАВ','СЛЕДУ','СЛОВО','СЛУЖБ','СЛУЧА','СМЕХ',
  'СМОТР','СНАЧА','СНЕГ','СОВЕТ','СОВСЕ','СОЗДА','СОЛНЦ','СОН','СООБЩ',
  'СОПРО','СОСЕД','СОСТА','СОТРУ','СОХРА','СПАСИ','СПЕЦИ','СПИНА','СПОРТ',
  'СПРАВ','СРЕДИ','СРЕДН','СТАЛ','СТАРЫ','СТАТЬ','СТЕНА','СТОЛ','СТОРО',
  'СТРАН','СТРОЙ','СТУЛ','СУДЬБ','СУТКИ','СЧАСТ','СЧЕТ','СЫН','ТАКЖЕ',
  'ТАМ','ТАНЕЦ','ТВЕРД','ТЕАТР','ТЕКСТ','ТЕЛЕФ','ТЕМА','ТЕМН','ТЕПЕР',
  'ТЕПЛ','ТЕХНИ','ТИХ','ТОГДА','ТОЖЕ','ТОЛПА','ТОЛЬК','ТОЧКА','ТОЧНО',
  'ТРЕБУ','ТРЕТИ','ТРИ','ТРУД','ТРУДН','ТУДА','ТУТ','ТЫСЯЧ','УВИД',
  'УЖЕ','УЗНАВ','УЛИЦ','УМЕР','УМЕТ','УНИВЕ','УПРАВ','УСЛОВ','УСПЕХ',
  'УСТАВ','УЧАСТ','УЧИТ','УЧИТЕ','ФАКТ','ФАМИЛ','ФЕВРА','ФИЛЬМ','ФОРМА',
  'ФРАНЦ','ХАРАК','ХОРОШ','ХОТЕТ','ХОТЯ','ХРАМ','ХУДОЖ','ЦВЕТ','ЦЕНА',
  'ЦЕНТР','ЦЕРКВ','ЧАСТ','ЧАСТО','ЧАСТЬ','ЧАЩЕ','ЧЕЛОВ','ЧЕМ','ЧЕРЕЗ',
  'ЧЕРН','ЧЕТЫР','ЧИСЛО','ЧИТАТ','ЧТО','ЧТОБЫ','ЧУВСТ','ШАГ','ШАПКА',
  'ШКОЛА','ШКОЛЬ','ШУМ','ЭТО','ЭТОТ',  'ЯВЛЯ','ЯЗЫК','ЯРК','ЯСНО'
];

const ENGLISH_WORDS = [
  'WORLD','HOUSE','PLACE','GROUP','PARTY','MONEY','POINT','STATE','NIGHT','WATER',
  'THING','ORDER','POWER','COURT','LEVEL','CHILD','SOUTH','STAFF','WOMAN','NORTH',
  'SENSE','DEATH','RANGE','TABLE','TRADE','STUDY','OTHER','PRICE','CLASS','UNION',
  'VALUE','PAPER','RIGHT','VOICE','STAGE','LIGHT','MARCH','BOARD','MONTH','MUSIC',
  'FIELD','AWARD','ISSUE','BASIS','FRONT','HEART','FORCE','MODEL','SPACE','PETER',
  'HOTEL','FLOOR','STYLE','EVENT','PRESS','DOUBT','BLOOD','SOUND','TITLE','GLASS',
  'EARTH','RIVER','WHOLE','PIECE','MOUTH','RADIO','PEACE','START','SHARE','TRUTH',
  'SMITH','STONE','QUEEN','STOCK','HORSE','PLANT','VISIT','SCALE','IMAGE','TRUST',
  'CHAIR','CAUSE','SPEED','CRIME','POUND','HENRY','MATCH','SCENE','STUFF','JAPAN',
  'CLAIM','VIDEO','TRIAL','PHONE','TRAIN','SIGHT','GRANT','SHAPE','OFFER','WHILE',
  'SMILE','TRACK','ROUTE','CHINA','TOUCH','YOUTH','WASTE','CROWN','BIRTH','FAITH',
  'ENTRY','TOTAL','MAJOR','OWNER','LUNCH','CROSS','JUDGE','GUIDE','COVER','JONES',
  'GREEN','BRAIN','PHASE','COAST','DRINK','DRIVE','METAL','INDEX','ADULT','SPORT',
  'NOISE','AGENT','SIMON','MOTOR','SHEET','BROWN','CROWD','SHOCK','FRUIT','STEEL',
  'PLATE','GRASS','DRESS','THEME','ERROR','LEWIS','WHITE','FOCUS','CHIEF','SLEEP',
  'BEACH','SUGAR','PANEL','DREAM','BREAD','CHAIN','CHEST','FRANK','BLOCK','STORE',
  'BREAK','DRAMA','SKILL','ROUND','RUGBY','SCOPE','PLANE','UNCLE','ABUSE','LIMIT',
  'TASTE','FAULT','TOWER','INPUT','ENEMY','ANGER','CYCLE','PILOT','FRAME','NOVEL',
  'REPLY','PRIZE','NURSE','CREAM','DEPTH','SHEEP','DANCE','SPITE','COACH','RATIO',
  'FIGHT','UNITY','STEAM','FINAL','CLOCK','PRIDE','BUYER','SMOKE','SCORE','WATCH',
  'APPLE','TREND','PROOF','PITCH','SHIRT','KNIFE','DRAFT','SHIFT','TERRY','SQUAD',
  'LAYER','LAURA','COLIN','CURVE','WHEEL','TOPIC','GUARD','ANGLE','SMELL','GRACE',
  'FLESH','MUMMY','PUPIL','GUEST','DELAY','MAYOR','LOGIC','ALBUM','HABIT','BILLY',
  'AUDIT','BAKER','PAINT','GREAT','STORM','WORTH','BLACK','DADDY','CANAL','ROBIN',
  'KELLY','LEAVE','LEASE','YOUNG','LOUIS','PRINT','FLEET','CRASH','COUNT','ASSET',
  'CLOUD','VILLA','ACTOR','OCEAN','BRAND','CRAFT','ALARM','BENCH','DIARY','ABBEY',
  'GRADE','BIBLE','JIMMY','SHELL','CLOTH','PIANO','CLERK','STAKE','BARRY','STAND',
  'MOUSE','CABLE','MANOR','LOCAL','PENNY','SHAME','CHECK','FORUM','BRICK','FRAUD',
  'STICK','GRAIN','MOVIE','CHEEK','REIGN','LABEL','THEFT','LOVER','SHORE','GUILT',
  'DEVIL','FENCE','GLORY','PANIC','JUICE','DEBUT','LAUGH','CHAOS','BRUCE','STRIP',
  'DERBY','JENNY','CHART','WIDOW','ESSAY','FIBRE','PATCH','FLUID','VIRUS','PAUSE',
  'ANGEL','CLIFF','BRASS','MAGIC','HONEY','ROVER','BACON','SALLY','TRICK','BONUS',
  'STRAW','SHELF','SAUCE','GRIEF','VERSE','SHADE','HEATH','SWORD','WAIST','SLOPE',
  'BETTY','ORGAN','SKIRT','GHOST','SERUM','LORRY','BRUSH','SPELL','LODGE','DEVON',
  'OZONE','NERVE','CRAIG','RALLY','EAGLE','BOWEL','SUITE','RIDGE','REACH','HUMAN',
  'GOULD','BREED','BLOKE','PHOTO','LEMON','CHARM','ELITE','BASIN','VENUE','FLOOD',
  'SWING','PUNCH','GRAVE','SAINT','INTEL','CORPS','BUNCH','USAGE','TRAIL','CAROL',
  'TOMMY','WIDTH','YIELD','FERRY','CLOSE','ARRAY','CRACK','CLASH','ALPHA','TRUCK',
  'TRACE','SALAD','MEDAL','CABIN','PLAIN','BRIDE','STAMP','TUTOR','MOUNT','BOBBY',
  'THUMB','MERCY','FEVER','LASER','REALM','BLADE','BOOST','FLOUR','ARROW','PULSE',
  'ELBOW','CLIVE','GRAPH','FLAME','ELLEN','SKULL','SWEAT','TEXAS','ARENA','MARSH',
  'MAKER','ULCER','FOLLY','WRIST','FROST','DONNA','CHOIR','RIDER','WHEAT','RIVAL',
  'EXILE','FLORA','SPINE','HOLLY','LOBBY','IRONY','ANKLE','GIANT','MASON','DAIRY',
  'MERIT','CHASE','IDEAL','AGONY','GLOOM','TOAST','LINEN','PROBE','SCENT','CANON',
  'SLIDE','METRE','BEARD','CHALK','BLAST','TIGER','VICAR','RULER','MOTIF','PADDY',
  'BEAST','WORRY','IVORY','SPLIT','SLAVE','HEDGE','LOTUS','SHAFT','CARGO','PROSE',
  'ALTAR','SMALL','FLASH','PIPER','QUEST','QUOTA','CATCH','TORCH','SLICE','FEAST'
];

// Функция для получения словаря по языку
const getWordsByLanguage = (language: 'russian' | 'english') => {
  return language === 'english' ? ENGLISH_WORDS : RUSSIAN_WORDS;
};

// Функция для получения случайного слова
const getRandomWord = (language: 'russian' | 'english' = 'russian') => {
  const words = getWordsByLanguage(language);
  return words[Math.floor(Math.random() * words.length)];
};

interface PlayerStatsProps {
  name: string;
  score: number;
  currentWord: string;
  attempts: number;
  isYou?: boolean;
  isLeading?: boolean;
  timeLeft: number;
}

function PlayerStats({ name, score, currentWord, attempts, isYou = false, isLeading = false, timeLeft }: PlayerStatsProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isLeading) {
      scale.value = withSequence(
        withSpring(1.05, { damping: 15 }),
        withSpring(1, { damping: 15 })
      );
    }
  }, [isLeading, score]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View style={[styles.playerStats, isLeading && styles.leadingPlayer, animatedStyle]}>
      <LinearGradient
        colors={isLeading ? ['#D97A6C', '#E89F93'] : ['#FFFFFF', '#FFF8F6']}
        style={styles.playerStatsGradient}
      >
        <View style={styles.playerStatsHeader}>
          <View style={styles.playerInfo}>
            <View style={[
              styles.playerAvatar,
              { backgroundColor: isLeading ? 'rgba(255,255,255,0.2)' : '#EADFD8' }
            ]}>
              <User size={16} color={isLeading ? '#FFFFFF' : '#D97A6C'} strokeWidth={2} />
            </View>
            <View>
              <Text style={[
                styles.playerName,
                { color: isLeading ? '#FFFFFF' : '#4A3F3D' }
              ]}>
                {name} {isYou && '(Вы)'}
              </Text>
              <Text style={[
                styles.playerScore,
                { color: isLeading ? 'rgba(255,255,255,0.8)' : '#8C7F7D' }
              ]}>
                {score} слов
              </Text>
            </View>
          </View>
          
          {isLeading && (
            <Crown size={16} color="#FFFFFF" strokeWidth={2} />
          )}
        </View>
        
        <View style={styles.playerProgress}>
          <Text style={[
            styles.currentWordLabel,
            { color: isLeading ? 'rgba(255,255,255,0.8)' : '#8C7F7D' }
          ]}>
            Текущее слово:
          </Text>
          <Text style={[
            styles.currentWord,
            { color: isLeading ? '#FFFFFF' : '#4A3F3D' }
          ]}>
            {currentWord || '-----'}
          </Text>
          <Text style={[
            styles.attempts,
            { color: isLeading ? 'rgba(255,255,255,0.7)' : '#B8A8A4' }
          ]}>
            Попытка {attempts}/6
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

interface WordGridProps {
  word: string;
  guesses: string[];
  currentGuess: string;
  targetWord: string;
}

function WordGrid({ word, guesses, currentGuess, targetWord }: WordGridProps) {
  const getLetterStatus = (letter: string, position: number, guess: string) => {
    if (!targetWord) return 'default';
    
    if (targetWord[position] === letter) return 'correct';
    if (targetWord.includes(letter)) return 'present';
    return 'absent';
  };

  const renderRow = (guess: string, rowIndex: number, isCurrentRow: boolean = false) => {
    const letters = guess.padEnd(5, ' ').split('');
    
    return (
      <View key={rowIndex} style={styles.wordRow}>
        {letters.map((letter, index) => {
          const status = guess.length === 5 && !isCurrentRow 
            ? getLetterStatus(letter, index, guess)
            : 'default';
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.letterCell,
                status === 'correct' && styles.correctCell,
                status === 'present' && styles.presentCell,
                status === 'absent' && styles.absentCell,
                isCurrentRow && letter !== ' ' && styles.filledCell
              ]}
              entering={isCurrentRow ? BounceIn.delay(index * 50) : undefined}
            >
              <Text style={[
                styles.letterText,
                (status === 'correct' || status === 'present' || status === 'absent') && styles.letterTextWhite
              ]}>
                {letter !== ' ' ? letter : ''}
              </Text>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.wordGrid}>
      {guesses.map((guess, index) => renderRow(guess, index))}
      {guesses.length < 6 && renderRow(currentGuess, guesses.length, true)}
      {Array.from({ length: Math.max(0, 6 - guesses.length - 1) }, (_, index) => 
        renderRow('', guesses.length + index + 1)
      )}
    </View>
  );
}

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  guessedLetters: { [key: string]: 'correct' | 'present' | 'absent' };
}

function Keyboard({ onKeyPress, guessedLetters, language = 'russian' }: KeyboardProps & { language?: 'russian' | 'english' }) {
  const russianRows = [
    ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З'],
    ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж'],
    ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю', 'Э']
  ];
  
  const englishRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];
  
  const rows = language === 'english' ? englishRows : russianRows;

  const handleKeyPress = (key: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onKeyPress(key);
  };

  return (
    <View style={styles.keyboard}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.keyboardRow}>
          {rowIndex === 2 && (
            <TouchableOpacity
              style={[styles.key, styles.actionKey]}
              onPress={() => handleKeyPress('ENTER')}
            >
              <Text style={styles.actionKeyText}>ВВОД</Text>
            </TouchableOpacity>
          )}
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.key,
                guessedLetters[key] === 'correct' && styles.correctKey,
                guessedLetters[key] === 'present' && styles.presentKey,
                guessedLetters[key] === 'absent' && styles.absentKey,
              ]}
              onPress={() => handleKeyPress(key)}
            >
              <Text style={[
                styles.keyText,
                guessedLetters[key] && styles.keyTextWhite
              ]}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
          {rowIndex === 2 && (
            <TouchableOpacity
              style={[styles.key, styles.actionKey]}
              onPress={() => handleKeyPress('BACKSPACE')}
            >
              <Text style={styles.actionKeyText}>←</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

interface GameSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onStart: (duration: number, language: 'russian' | 'english') => void;
}

function GameSetupModal({ visible, onClose, onStart }: GameSetupModalProps) {
  const [selectedDuration, setSelectedDuration] = useState(180); // 3 минуты по умолчанию
  const [selectedLanguage, setSelectedLanguage] = useState<'russian' | 'english'>('russian');

  const durations = [
    { value: 60, label: '1 минута', subtitle: 'Быстрая игра' },
    { value: 180, label: '3 минуты', subtitle: 'Стандартная игра' },
    { value: 300, label: '5 минут', subtitle: 'Длинная игра' },
    { value: 600, label: '10 минут', subtitle: 'Марафон' },
  ];

  const handleStart = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onStart(selectedDuration, selectedLanguage);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Animated.View 
          entering={SlideInUp.delay(100)}
          exiting={SlideOutDown}
          style={styles.modalContent}
        >
          <LinearGradient
            colors={['#FFFFFF', '#FFF8F6']}
            style={styles.modalGradient}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Настройка игры</Text>
              <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
                <X size={24} color="#8C7F7D" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Выберите язык и продолжительность матча
            </Text>
            <Text style={styles.modalSubtitle}>
              Текущий язык: {selectedLanguage === 'russian' ? 'Русский' : 'English'}
            </Text>

            <View style={styles.languageOptions}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'russian' && styles.selectedLanguageOption
                ]}
                onPress={() => {
                  setSelectedLanguage('russian');
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync();
                  }
                }}
              >
                <Text style={[
                  styles.languageText,
                  selectedLanguage === 'russian' && styles.selectedLanguageText
                ]}>
                  🇷🇺 Русский
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  selectedLanguage === 'english' && styles.selectedLanguageOption
                ]}
                onPress={() => {
                  setSelectedLanguage('english');
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync();
                  }
                }}
              >
                <Text style={[
                  styles.languageText,
                  selectedLanguage === 'english' && styles.selectedLanguageText
                ]}>
                  🇺🇸 English
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Продолжительность матча
            </Text>

            <View style={styles.durationOptions}>
              {durations.map((duration) => (
                <TouchableOpacity
                  key={duration.value}
                  style={[
                    styles.durationOption,
                    selectedDuration === duration.value && styles.selectedDurationOption
                  ]}
                  onPress={() => {
                    setSelectedDuration(duration.value);
                    if (Platform.OS !== 'web') {
                      Haptics.selectionAsync();
                    }
                  }}
                >
                  <View style={styles.durationOptionContent}>
                    <View style={[
                      styles.durationRadio,
                      selectedDuration === duration.value && styles.selectedDurationRadio
                    ]}>
                      {selectedDuration === duration.value && (
                        <View style={styles.durationRadioDot} />
                      )}
                    </View>
                    <View style={styles.durationInfo}>
                      <Text style={[
                        styles.durationLabel,
                        selectedDuration === duration.value && styles.selectedDurationLabel
                      ]}>
                        {duration.label}
                      </Text>
                      <Text style={styles.durationSubtitle}>
                        {duration.subtitle}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                <LinearGradient
                  colors={['#D97A6C', '#E89F93']}
                  style={styles.startButtonGradient}
                >
                  <Play size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.startButtonText}>Начать игру</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function WordleScreen() {
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [timeLeft, setTimeLeft] = useState(180);
  const [gameDuration, setGameDuration] = useState(180);
  const [showSetupModal, setShowSetupModal] = useState(true);
  
  // Player states
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerCurrentWord, setPlayerCurrentWord] = useState('');
  const [playerGuesses, setPlayerGuesses] = useState<string[]>([]);
  const [playerCurrentGuess, setPlayerCurrentGuess] = useState('');
  const [playerAttempts, setPlayerAttempts] = useState(1);
  const [playerTargetWord, setPlayerTargetWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<{ [key: string]: 'correct' | 'present' | 'absent' }>({});

  // Opponent simulation
  const [opponentCurrentWord, setOpponentCurrentWord] = useState('');
  const [opponentAttempts, setOpponentAttempts] = useState(1);
  const [language, setLanguage] = useState<'russian' | 'english'>('russian');

  useEffect(() => {
    if (gamePhase === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gamePhase === 'playing') {
      setGamePhase('finished');
    }
  }, [timeLeft, gamePhase]);

  // Обработка физической клавиатуры
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gamePhase !== 'playing') return;
      
      const key = event.key.toUpperCase();
      
      // Проверяем, что клавиша соответствует выбранному языку
      const words = getWordsByLanguage(language);
      const validChars = language === 'english' 
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        : 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
      
      if (validChars.includes(key) && playerCurrentGuess.length < 5) {
        setPlayerCurrentGuess(prev => prev + key);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } else if (key === 'BACKSPACE' || key === 'DELETE') {
        setPlayerCurrentGuess(prev => prev.slice(0, -1));
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } else if (key === 'ENTER') {
        if (playerCurrentGuess.length === 5) {
          submitGuess();
        }
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [gamePhase, playerCurrentGuess, language]);

  // Simulate opponent progress
  useEffect(() => {
    if (gamePhase === 'playing') {
      const interval = setInterval(() => {
        // Opponent completes a word every 15-25 seconds
        if (Math.random() < 0.05) {
          setOpponentScore(prev => prev + 1);
          setOpponentCurrentWord(getRandomWord(language));
          setOpponentAttempts(Math.floor(Math.random() * 4) + 1);
          
          setTimeout(() => {
            setOpponentCurrentWord('');
            setOpponentAttempts(1);
          }, 2000);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gamePhase]);

  const getRandomWordForGame = () => {
    return getRandomWord(language);
  };

  const startGame = (duration: number, selectedLanguage: 'russian' | 'english') => {
    setGameDuration(duration);
    setTimeLeft(duration);
    setGamePhase('playing');
    setShowSetupModal(false);
    setLanguage(selectedLanguage);
    setPlayerTargetWord(getRandomWordForGame());
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleKeyPress = (key: string) => {
    if (gamePhase !== 'playing') return;

    if (key === 'BACKSPACE') {
      setPlayerCurrentGuess(prev => prev.slice(0, -1));
    } else if (key === 'ENTER') {
      if (playerCurrentGuess.length === 5) {
        submitGuess();
      }
    } else if (playerCurrentGuess.length < 5) {
      setPlayerCurrentGuess(prev => prev + key);
    }
  };

  const submitGuess = () => {
    if (playerCurrentGuess.length !== 5) return;

    // Валидация: слово должно быть в словаре
    const words = getWordsByLanguage(language);
    if (!words.includes(playerCurrentGuess)) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Нет такого слова', 'Попробуйте другое слово из словаря');
      return;
    }

    const newGuesses = [...playerGuesses, playerCurrentGuess];
    setPlayerGuesses(newGuesses);

    // Update guessed letters
    const newGuessedLetters = { ...guessedLetters };
    for (let i = 0; i < playerCurrentGuess.length; i++) {
      const letter = playerCurrentGuess[i];
      if (playerTargetWord[i] === letter) {
        newGuessedLetters[letter] = 'correct';
      } else if (playerTargetWord.includes(letter) && newGuessedLetters[letter] !== 'correct') {
        newGuessedLetters[letter] = 'present';
      } else if (!playerTargetWord.includes(letter)) {
        newGuessedLetters[letter] = 'absent';
      }
    }
    setGuessedLetters(newGuessedLetters);

    if (playerCurrentGuess === playerTargetWord) {
      // Word guessed correctly
      setPlayerScore(prev => prev + 1);
      setPlayerCurrentGuess('');
      setPlayerGuesses([]);
      setPlayerAttempts(1);
      setPlayerTargetWord(getRandomWordForGame());
      setGuessedLetters({});
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else if (newGuesses.length >= 6) {
      // Failed to guess word
      setPlayerCurrentGuess('');
      setPlayerGuesses([]);
      setPlayerAttempts(1);
      setPlayerTargetWord(getRandomWordForGame());
      setGuessedLetters({});
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } else {
      setPlayerCurrentGuess('');
      setPlayerAttempts(prev => prev + 1);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gamePhase === 'finished') {
    const isWinner = playerScore > opponentScore;
    const coinReward = isWinner ? 75 : 25;
    
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#D97A6C" />
        
        <View style={styles.resultContainer}>
          <Animated.View entering={BounceIn.delay(100)} style={styles.resultCard}>
            <LinearGradient
              colors={isWinner ? ['#D97A6C', '#E89F93'] : ['#8C7F7D', '#B8A8A4']}
              style={styles.resultGradient}
            >
              <Trophy size={56} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.resultTitle}>
                {isWinner ? '🎉 Победа!' : '😔 Поражение'}
              </Text>
              <Text style={styles.resultScore}>
                {playerScore} : {opponentScore}
              </Text>
              
              <View style={styles.resultStats}>
                <View style={styles.resultStat}>
                  <Target size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                  <Text style={styles.resultStatText}>
                    {playerScore} слов отгадано
                  </Text>
                </View>
                <View style={styles.resultStat}>
                  <Zap size={16} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                  <Text style={styles.resultStatText}>
                    +{coinReward} монет
                  </Text>
                </View>
              </View>
              
              <Text style={styles.resultText}>
                {isWinner 
                  ? 'Отличная игра! Ваш словарный запас впечатляет.'
                  : 'Хорошая попытка! Тренируйтесь и станете лучше.'
                }
              </Text>
              
              <View style={styles.resultActions}>
                <TouchableOpacity 
                  style={styles.playAgainButton} 
                  onPress={() => {
                    setGamePhase('setup');
                    setShowSetupModal(true);
                    setPlayerScore(0);
                    setOpponentScore(0);
                    setPlayerCurrentGuess('');
                    setPlayerGuesses([]);
                    setPlayerAttempts(1);
                    setGuessedLetters({});
                  }}
                >
                  <Text style={styles.playAgainText}>Играть еще</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.backToLobbyButton} onPress={() => router.back()}>
                  <Text style={styles.backToLobbyText}>В лобби</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F6" />
      
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#4A3F3D" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Wordle PvP</Text>
          <Text style={styles.headerSubtitle}>Соревнование на время</Text>
        </View>
        <View style={styles.timerContainer}>
          <Clock size={16} color={timeLeft <= 30 ? '#D35D5D' : '#D97A6C'} strokeWidth={2} />
          <Text style={[
            styles.timerText,
            timeLeft <= 30 && styles.timerTextUrgent
          ]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </Animated.View>

      {/* Player Stats */}
      <View style={styles.playersContainer}>
        <PlayerStats
          name="Вы"
          score={playerScore}
          currentWord={''}
          attempts={playerAttempts}
          isYou={true}
          isLeading={playerScore >= opponentScore}
          timeLeft={timeLeft}
        />
        <PlayerStats
          name="Соперник"
          score={opponentScore}
          currentWord={opponentCurrentWord}
          attempts={opponentAttempts}
          isLeading={opponentScore > playerScore}
          timeLeft={timeLeft}
        />
      </View>

      {/* Game Area */}
      <View style={styles.gameArea}>
        <WordGrid
          word={playerTargetWord}
          guesses={playerGuesses}
          currentGuess={playerCurrentGuess}
          targetWord={playerTargetWord}
        />
      </View>

      {/* Keyboard */}
      <Keyboard
        onKeyPress={handleKeyPress}
        guessedLetters={guessedLetters}
        language={language}
      />

      {/* Setup Modal */}
      <GameSetupModal
        visible={showSetupModal}
        onClose={() => router.back()}
        onStart={startGame}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '500',
    color: '#8C7F7D',
    marginTop: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timerText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#D97A6C',
    marginLeft: 4,
  },
  timerTextUrgent: {
    color: '#D35D5D',
  },
  playersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  playerStats: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  leadingPlayer: {
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  playerStatsGradient: {
    padding: 16,
  },
  playerStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  playerName: {
    fontSize: 13,
    fontFamily: 'System',
    fontWeight: '600',
    marginBottom: 2,
  },
  playerScore: {
    fontSize: 11,
    fontFamily: 'System',
    fontWeight: '500',
  },
  playerProgress: {
    alignItems: 'center',
  },
  currentWordLabel: {
    fontSize: 10,
    fontFamily: 'System',
    fontWeight: '500',
    marginBottom: 4,
  },
  currentWord: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '700',
    marginBottom: 2,
  },
  attempts: {
    fontSize: 9,
    fontFamily: 'System',
    fontWeight: '400',
  },
  gameArea: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  wordGrid: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wordRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  letterCell: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: '#F2E9E8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    borderRadius: 8,
  },
  filledCell: {
    borderColor: '#D97A6C',
    backgroundColor: '#FFF8F6',
  },
  correctCell: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  presentCell: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800',
  },
  absentCell: {
    backgroundColor: '#8C7F7D',
    borderColor: '#8C7F7D',
  },
  letterText: {
    fontSize: 20,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
  },
  letterTextWhite: {
    color: '#FFFFFF',
  },
  keyboard: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  key: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 2,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionKey: {
    paddingHorizontal: 12,
    backgroundColor: '#D97A6C',
  },
  correctKey: {
    backgroundColor: '#4CAF50',
  },
  presentKey: {
    backgroundColor: '#FF9800',
  },
  absentKey: {
    backgroundColor: '#8C7F7D',
  },
  keyText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#4A3F3D',
  },
  keyTextWhite: {
    color: '#FFFFFF',
  },
  actionKeyText: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth - 40,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#4A3F3D',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#8C7F7D',
    marginBottom: 24,
  },
  durationOptions: {
    marginBottom: 32,
  },
  durationOption: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F2E9E8',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    overflow: 'hidden',
  },
  selectedDurationOption: {
    borderColor: '#D97A6C',
    backgroundColor: '#FFF8F6',
  },
  durationOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  durationRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F2E9E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  selectedDurationRadio: {
    borderColor: '#D97A6C',
  },
  durationRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D97A6C',
  },
  durationInfo: {
    flex: 1,
  },
  durationLabel: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#4A3F3D',
    marginBottom: 2,
  },
  selectedDurationLabel: {
    color: '#D97A6C',
  },
  durationSubtitle: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '400',
    color: '#8C7F7D',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2E9E8',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#8C7F7D',
  },
  startButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(217, 122, 108, 0.1)',
  },
  resultCard: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#67382E',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
  },
  resultGradient: {
    padding: 40,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 32,
    fontFamily: 'System',
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  resultScore: {
    fontSize: 28,
    fontFamily: 'System',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  resultStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  resultStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resultStatText: {
    fontSize: 12,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  resultText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  playAgainButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  playAgainText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backToLobbyButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  backToLobbyText: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#D97A6C',
  },
  languageOptions: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  languageOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#F2E9E8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedLanguageOption: {
    borderColor: '#D97A6C',
    backgroundColor: '#FFF8F6',
  },
  languageText: {
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
    color: '#8C7F7D',
  },
  selectedLanguageText: {
    color: '#D97A6C',
  },
});