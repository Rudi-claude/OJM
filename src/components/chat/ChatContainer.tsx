"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatMessage from "./ChatMessage";
import MoodChips from "./MoodChips";
import RecommendCard from "./RecommendCard";
import WeatherBadge from "../WeatherBadge";
import { useMealLogs } from "@/hooks/useMealLogs";
import type {
  ChatMessage as ChatMessageType,
  MoodType,
  WeatherData,
  ScoredRestaurant,
  RecommendResponse,
  Restaurant,
} from "@/types";

type ChatStep = "greeting" | "mood" | "recommend" | "ate" | "done";

interface ChatContainerProps {
  restaurants: Restaurant[];
  weather: WeatherData | null;
  mapCenter?: { lat: number; lng: number };
  searchedAddress: string;
  userId?: string;
  onTeamCandidate?: (restaurant: Restaurant) => void;
}

export default function ChatContainer({
  restaurants: propRestaurants,
  weather: propWeather,
  mapCenter,
  searchedAddress,
  userId,
  onTeamCandidate,
}: ChatContainerProps) {
  const { addMealLog, fetchMealLogs } = useMealLogs();

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [step, setStep] = useState<ChatStep>("greeting");
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>();
  const [recommendations, setRecommendations] = useState<ScoredRestaurant[]>([]);
  const [currentRecommendIndex, setCurrentRecommendIndex] = useState(0);
  const [isRecommendLoading, setIsRecommendLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

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

  // 초기 인사 및 날씨 정보 표시
  useEffect(() => {
    if (step === "greeting" && !hasStartedRef.current) {
      hasStartedRef.current = true;

      const timer = setTimeout(() => {
        addMessage(
          "bot",
          `안녕하세요! ${searchedAddress} 주변 맛집을 추천해드릴게요. 😊`
        );

        setTimeout(() => {
          // 날씨 정보 표시
          if (propWeather) {
            addMessage("bot", `오늘 날씨: ${propWeather.description}`);

            if (
              propWeather.recommendations &&
              propWeather.recommendations.length > 0 &&
              propWeather.recommendations[0] !== "모든 음식이 좋아요!"
            ) {
              setTimeout(() => {
                addMessage(
                  "bot",
                  `이 날씨엔 ${propWeather.recommendations.slice(0, 3).join(", ")} 같은 음식이 좋겠네요!`
                );
                setTimeout(() => {
                  addMessage("bot", "오늘 기분은 어떠세요?", "mood-chips");
                  setStep("mood");
                }, 600);
              }, 600);
            } else {
              setTimeout(() => {
                addMessage("bot", "오늘 기분은 어떠세요?", "mood-chips");
                setStep("mood");
              }, 600);
            }
          } else {
            addMessage("bot", "오늘 기분은 어떠세요?", "mood-chips");
            setStep("mood");
          }
        }, 600);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [step, addMessage, searchedAddress, propWeather]);

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

  const fetchRecommendations = async (mood: MoodType) => {
    setIsRecommendLoading(true);
    try {
      if (userId) {
        await fetchMealLogs(userId, 7);
      }

      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          mood,
          weather: propWeather,
          restaurants: propRestaurants,
          lat: mapCenter?.lat,
          lng: mapCenter?.lng,
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
        setStep("done");
      }
    } catch (error) {
      console.error("추천 조회 실패:", error);
      addMessage("bot", "추천을 가져오는 중 문제가 생겼어요. 다시 시도해주세요.");
      setStep("done");
    } finally {
      setIsRecommendLoading(false);
    }
  };

  const handleAte = async (restaurant: ScoredRestaurant) => {
    if (!userId) {
      addMessage("bot", "식사 기록을 저장하려면 잠시 후 다시 시도해주세요.");
      return;
    }

    const success = await addMealLog({
      userId,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      category: restaurant.category,
      weather: propWeather?.condition,
      mood: selectedMood,
    });

    if (success) {
      addMessage("user", `${restaurant.name}에서 먹을게요!`);
      addMessage(
        "bot",
        `좋은 선택이에요! ${restaurant.name}에서 맛있게 드세요. 🍴`
      );
      setStep("done");
    } else {
      addMessage("bot", "기록 저장에 실패했어요. 하지만 맛있게 드세요!");
      setStep("done");
    }
  };

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

  const handleRestart = () => {
    setMessages([]);
    setStep("greeting");
    setSelectedMood(undefined);
    setRecommendations([]);
    setCurrentRecommendIndex(0);
    hasStartedRef.current = false;
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FC]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-[#6B77E8] to-[#8B95FF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#6B77E8]/20">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div>
            <h2 className="font-bold text-gray-900">AI 점심 추천</h2>
            <p className="text-xs text-gray-400">{searchedAddress} 주변</p>
          </div>
        </div>
        {propWeather && <WeatherBadge weather={propWeather} isLoading={false} />}
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
                  onTeamCandidate={onTeamCandidate ? (r) => onTeamCandidate(r as Restaurant) : undefined}
                  isLoading={isRecommendLoading}
                />
              )}
          </ChatMessage>
        ))}

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
        <div className="p-4 bg-white border-t border-gray-100">
          <button
            onClick={handleRestart}
            className="w-full py-4 bg-gradient-to-r from-[#6B77E8] to-[#8B95FF] text-white rounded-2xl font-semibold hover:shadow-lg hover:shadow-[#6B77E8]/25 transition-all"
          >
            다시 추천받기
          </button>
        </div>
      )}
    </div>
  );
}
