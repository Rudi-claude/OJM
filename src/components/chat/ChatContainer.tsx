"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatMessage from "./ChatMessage";
import MoodChips from "./MoodChips";
import RecommendCard from "./RecommendCard";
import WeatherBadge from "../WeatherBadge";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";
import { useMealLogs } from "@/hooks/useMealLogs";
import type {
  ChatMessage as ChatMessageType,
  MoodType,
  WeatherData,
  ScoredRestaurant,
  RecommendResponse,
} from "@/types";

type ChatStep = "greeting" | "weather" | "mood" | "recommend" | "ate" | "done";

export default function ChatContainer() {
  const { user } = useAnonymousUser();
  const { addMealLog, fetchMealLogs } = useMealLogs();

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [step, setStep] = useState<ChatStep>("greeting");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>();
  const [recommendations, setRecommendations] = useState<ScoredRestaurant[]>([]);
  const [currentRecommendIndex, setCurrentRecommendIndex] = useState(0);
  const [isRecommendLoading, setIsRecommendLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = useCallback(
    (
      type: "bot" | "user",
      content: string,
      component?: ChatMessageType["component"],
      data?: unknown
    ) => {
      const newMessage: ChatMessageType = {
        id: uuidv4(),
        type,
        content,
        timestamp: new Date(),
        component,
        data,
      };
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    []
  );

  // 초기 인사
  useEffect(() => {
    if (step === "greeting") {
      const timer = setTimeout(() => {
        addMessage("bot", "안녕하세요! 오늘 점심 뭐 드실지 도와드릴게요.");
        setTimeout(() => {
          addMessage("bot", "먼저 오늘 날씨를 확인해볼게요...", "weather-badge");
          setStep("weather");
          fetchWeather();
        }, 800);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [step, addMessage]);

  // 날씨 조회
  const fetchWeather = async () => {
    setIsWeatherLoading(true);
    try {
      // 위치 정보 가져오기
      let lat = 37.5665;
      let lng = 126.978;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
              });
            }
          );
          lat = position.coords.latitude;
          lng = position.coords.longitude;
        } catch {
          console.log("위치 정보를 가져올 수 없어 기본 위치 사용");
        }
      }

      const response = await fetch(`/api/weather?lat=${lat}&lng=${lng}`);
      const data = await response.json();

      if (data.weather) {
        setWeather(data.weather);
        setTimeout(() => {
          addMessage("bot", data.weather.description);
          if (
            data.weather.recommendations &&
            data.weather.recommendations.length > 0 &&
            data.weather.recommendations[0] !== "모든 음식이 좋아요!"
          ) {
            addMessage(
              "bot",
              `${data.weather.recommendations.slice(0, 3).join(", ")} 같은 음식은 어떨까요?`
            );
          }
          setTimeout(() => {
            addMessage("bot", "오늘 기분은 어떠세요?", "mood-chips");
            setStep("mood");
          }, 800);
        }, 500);
      }
    } catch (error) {
      console.error("날씨 조회 실패:", error);
      addMessage("bot", "날씨 정보를 가져오지 못했어요. 그래도 추천해드릴게요!");
      setTimeout(() => {
        addMessage("bot", "오늘 기분은 어떠세요?", "mood-chips");
        setStep("mood");
      }, 800);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  // 기분 선택
  const handleMoodSelect = async (mood: MoodType) => {
    setSelectedMood(mood);
    const moodLabel = {
      hearty: "든든하게",
      light: "가볍게",
      special: "특별하게",
      quick: "빠르게",
    }[mood];

    addMessage("user", moodLabel);
    setStep("recommend");
    await fetchRecommendations(mood);
  };

  // 추천 조회
  const fetchRecommendations = async (mood: MoodType) => {
    setIsRecommendLoading(true);
    try {
      if (user?.id) {
        await fetchMealLogs(user.id, 7);
      }

      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          mood,
          weather,
        }),
      });

      const data: RecommendResponse = await response.json();

      if (data.restaurants && data.restaurants.length > 0) {
        setRecommendations(data.restaurants);
        setCurrentRecommendIndex(0);
        addMessage("bot", data.message, "recommend-card", data.restaurants);
      } else {
        addMessage(
          "bot",
          "주변에 추천할 만한 식당을 찾지 못했어요. 다시 시도해볼까요?"
        );
      }
    } catch (error) {
      console.error("추천 조회 실패:", error);
      addMessage("bot", "추천을 가져오는 중 문제가 생겼어요. 다시 시도해주세요.");
    } finally {
      setIsRecommendLoading(false);
    }
  };

  // "먹었어!" 처리
  const handleAte = async (restaurant: ScoredRestaurant) => {
    if (!user?.id) {
      addMessage("bot", "식사 기록을 저장하려면 잠시 후 다시 시도해주세요.");
      return;
    }

    const success = await addMealLog({
      userId: user.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      category: restaurant.category,
      weather: weather?.condition,
      mood: selectedMood,
    });

    if (success) {
      addMessage("user", `${restaurant.name}에서 먹을게요!`);
      addMessage(
        "bot",
        `좋은 선택이에요! ${restaurant.name}에서 맛있게 드세요. 다음에 또 도와드릴게요!`
      );
      setStep("done");
    } else {
      addMessage("bot", "기록 저장에 실패했어요. 하지만 맛있게 드세요!");
      setStep("done");
    }
  };

  // "다른 거" 처리
  const handleNext = () => {
    if (currentRecommendIndex < recommendations.length - 1) {
      const nextIndex = currentRecommendIndex + 1;
      setCurrentRecommendIndex(nextIndex);
      const nextRestaurant = recommendations[nextIndex];
      addMessage(
        "bot",
        `그럼 ${nextRestaurant.name}(${nextRestaurant.category})은 어떠세요?`,
        "recommend-card",
        recommendations
      );
    } else {
      addMessage("bot", "더 이상 추천할 식당이 없어요. 처음부터 다시 해볼까요?");
      setStep("done");
    }
  };

  // 다시 시작
  const handleRestart = () => {
    setMessages([]);
    setStep("greeting");
    setWeather(null);
    setSelectedMood(undefined);
    setRecommendations([]);
    setCurrentRecommendIndex(0);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg">🍽️</span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">오점뭐 봇</h2>
            <p className="text-xs text-gray-500">점심 메뉴 추천</p>
          </div>
        </div>
        {weather && <WeatherBadge weather={weather} isLoading={isWeatherLoading} />}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message}>
            {message.component === "mood-chips" && step === "mood" && (
              <MoodChips
                onSelect={handleMoodSelect}
                selectedMood={selectedMood}
                disabled={step !== "mood"}
              />
            )}
            {message.component === "recommend-card" &&
              recommendations.length > 0 && (
                <RecommendCard
                  restaurants={recommendations}
                  currentIndex={currentRecommendIndex}
                  onAte={handleAte}
                  onNext={handleNext}
                  isLoading={isRecommendLoading}
                />
              )}
          </ChatMessage>
        ))}

        {isWeatherLoading && (
          <ChatMessage
            message={{
              id: "loading",
              type: "bot",
              content: "날씨 정보를 가져오는 중...",
              timestamp: new Date(),
            }}
          />
        )}

        {isRecommendLoading && (
          <ChatMessage
            message={{
              id: "loading-recommend",
              type: "bot",
              content: "맛집을 찾고 있어요...",
              timestamp: new Date(),
            }}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Restart Button */}
      {step === "done" && (
        <div className="p-4 bg-white border-t">
          <button
            onClick={handleRestart}
            className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
          >
            다시 추천받기
          </button>
        </div>
      )}
    </div>
  );
}
