import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Brain, 
  Award, 
  TreePine, 
  Microscope, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Lightbulb,
  Target,
  Link2,
  Shuffle,
  ChevronRight,
  ListChecks
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string[];
  example: string;
  completed: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const animals = [
  { name: "Lion", correctRank: "Family", ranks: ["Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species"] },
  { name: "Human", correctRank: "Genus", ranks: ["Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species"] },
  { name: "Eagle", correctRank: "Order", ranks: ["Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species"] },
  { name: "Shark", correctRank: "Class", ranks: ["Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species"] },
];

// Name Builder Data
const genusOptions = ["Panthera", "Canis", "Felis", "Homo"];
const speciesOptions = ["leo", "lupus", "catus", "sapiens"];
const correctNames = {
  "Panthera": "leo",
  "Canis": "lupus",
  "Felis": "catus",
  "Homo": "sapiens"
};

// Phylogeny Explorer Data
const phyloData = [
  {
    root: "Animalia",
    branches: [
      { name: "Chordata", children: [
        { name: "Mammalia", children: [
          { name: "Primates", children: [
            { name: "Homo sapiens" }
          ]},
          { name: "Carnivora", children: [
            { name: "Panthera leo" }
          ]}
        ]},
        { name: "Aves", children: [
          { name: "Accipitriformes", children: [
            { name: "Aquila chrysaetos" }
          ]}
        ]}
      ]}
    ]
  }
];

// Memory Challenge Data
const memoryPairs = [
  { common: "Lion", scientific: "Panthera leo" },
  { common: "Human", scientific: "Homo sapiens" },
  { common: "Cat", scientific: "Felis catus" },
  { common: "Wolf", scientific: "Canis lupus" }
];

const LearnTaxonomy = () => {
  const [currentLesson, setCurrentLesson] = useState(0);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Classification Game states
  const [gameStarted, setGameStarted] = useState(false);
  const [currentAnimal, setCurrentAnimal] = useState(0);
  const [answered, setAnswered] = useState(false);

  // Name Builder states
  const [nameGameStarted, setNameGameStarted] = useState(false);
  const [selectedGenus, setSelectedGenus] = useState<string | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [nameAnswered, setNameAnswered] = useState(false);

  // Phylogeny Explorer states
  const [phyloStarted, setPhyloStarted] = useState(false);
  const [phyloRevealed, setPhyloRevealed] = useState(false);

  // Memory Challenge states
  const [memoryStarted, setMemoryStarted] = useState(false);
  const [memoryCurrent, setMemoryCurrent] = useState(0);
  const [memoryAnswer, setMemoryAnswer] = useState<string | null>(null);
  const [memoryAnswered, setMemoryAnswered] = useState(false);
  const [memoryScore, setMemoryScore] = useState(0);

  const lessons: Lesson[] = [
    {
      id: 'intro',
      title: 'Introduction to Taxonomy',
      description: 'Learn the basics of biological classification',
      content: [
        'Taxonomy is the science of naming, describing, and classifying organisms.',
        'It helps scientists organize and understand the diversity of life on Earth.',
        'The system was developed by Carl Linnaeus in the 18th century.',
        'Modern taxonomy uses genetic, morphological, and behavioral characteristics.'
      ],
      example: 'Humans are classified as Homo sapiens - where Homo is the genus and sapiens is the species.',
      completed: false
    },
    {
      id: 'hierarchy',
      title: 'Taxonomic Hierarchy',
      description: 'Understand the levels of classification',
      content: [
        'Kingdom: The largest and most inclusive group (e.g., Animalia)',
        'Phylum: Major body plan differences (e.g., Chordata - animals with backbones)',
        'Class: Groups with similar characteristics (e.g., Mammalia - mammals)',
        'Order: Groups with similar lifestyles (e.g., Carnivora - meat eaters)',
        'Family: Groups with similar structures (e.g., Felidae - cats)',
        'Genus: Closely related species (e.g., Panthera - big cats)',
        'Species: Organisms that can interbreed (e.g., Panthera leo - lions)'
      ],
      example: 'Remember: "King Philip Came Over For Good Soup" (Kingdom, Phylum, Class, Order, Family, Genus, Species)',
      completed: false
    },
    {
      id: 'binomial',
      title: 'Binomial Nomenclature',
      description: 'Learn the two-part naming system',
      content: [
        'Every species has a unique two-part scientific name.',
        'The first part is the genus name (always capitalized).',
        'The second part is the species name (never capitalized).',
        'Both parts are written in italics or underlined.',
        'This system ensures universal communication among scientists.'
      ],
      example: 'Canis lupus (gray wolf), Felis catus (domestic cat), Homo sapiens (human)',
      completed: false
    },
    {
      id: 'evolution',
      title: 'Taxonomy and Evolution',
      description: 'How classification reflects evolutionary relationships',
      content: [
        'Modern taxonomy reflects evolutionary relationships.',
        'Organisms in the same group share common ancestors.',
        'DNA analysis helps determine these relationships.',
        'Phylogenetic trees show evolutionary connections.',
        'Classification can change as we learn more about evolution.'
      ],
      example: 'Birds and dinosaurs are closely related - birds are actually living dinosaurs!',
      completed: false
    }
  ];

  const quizQuestions: QuizQuestion[] = [
    {
      id: 'q1',
      question: 'What is the correct order of taxonomic hierarchy from largest to smallest?',
      options: [
        'Kingdom, Phylum, Class, Order, Family, Genus, Species',
        'Kingdom, Class, Phylum, Order, Family, Genus, Species',
        'Phylum, Kingdom, Class, Order, Family, Genus, Species',
        'Kingdom, Phylum, Order, Class, Family, Genus, Species'
      ],
      correct: 0,
      explanation: 'The correct order is Kingdom, Phylum, Class, Order, Family, Genus, Species - remember "King Philip Came Over For Good Soup"!'
    },
    {
      id: 'q2',
      question: 'In the scientific name Panthera leo, which part represents the genus?',
      options: ['leo', 'Panthera', 'Both parts', 'Neither part'],
      correct: 1,
      explanation: 'Panthera is the genus name (always capitalized), while leo is the species name (never capitalized).'
    },
    {
      id: 'q3',
      question: 'What does taxonomy help scientists do?',
      options: [
        'Only name new species',
        'Organize and understand biodiversity',
        'Only study extinct animals',
        'Only classify plants'
      ],
      correct: 1,
      explanation: 'Taxonomy helps scientists organize and understand the diversity of all life on Earth, including plants, animals, and microorganisms.'
    },
    {
      id: 'q4',
      question: 'Modern taxonomy is primarily based on:',
      options: [
        'Only physical appearance',
        'Only behavior',
        'Genetic, morphological, and behavioral characteristics',
        'Only size'
      ],
      correct: 2,
      explanation: 'Modern taxonomy uses multiple types of evidence including genetics, physical characteristics (morphology), and behavior to classify organisms.'
    }
  ];

  const completeLesson = (lessonId: string) => {
    setCompletedLessons(prev => new Set([...prev, lessonId]));
    toast({
      title: "Lesson completed! 🎉",
      description: "Great job! You've mastered this topic.",
    });
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (answerIndex === quizQuestions[currentQuiz].correct) {
      setScore(prev => prev + 1);
      toast({
        title: "Correct! ✅",
        description: "Well done! Your answer is correct.",
      });
    } else {
      toast({
        title: "Incorrect ❌",
        description: "Don't worry, learning takes practice!",
        variant: "destructive",
      });
    }
  };

  const nextQuiz = () => {
    if (currentQuiz < quizQuestions.length - 1) {
      setCurrentQuiz(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const progressPercentage = (completedLessons.size / lessons.length) * 100;

  // Classification Game handlers
  const startGame = () => {
    setGameStarted(true);
    setCurrentAnimal(0);
    setAnswered(false);
  };

  const handleRankClick = (rank: string) => {
    setAnswered(true);
    if (rank === animals[currentAnimal].correctRank) {
      toast({
        title: "Correct!",
        description: `You chose ${rank} for ${animals[currentAnimal].name}.`,
      });
    } else {
      toast({
        title: "Try Again!",
        description: `The correct rank for ${animals[currentAnimal].name} is ${animals[currentAnimal].correctRank}.`,
        variant: "destructive",
      });
    }
  };

  const nextAnimal = () => {
    if (currentAnimal + 1 < animals.length) {
      setCurrentAnimal(prev => prev + 1);
      setAnswered(false);
    } else {
      toast({
        title: "Game Complete!",
        description: "You finished the classification game.",
      });
      setGameStarted(false);
    }
  };

  // Name Builder handlers
  const startNameGame = () => {
    setNameGameStarted(true);
    setSelectedGenus(null);
    setSelectedSpecies(null);
    setNameAnswered(false);
  };

  const handleNameSelect = () => {
    setNameAnswered(true);
    if (selectedGenus && selectedSpecies && correctNames[selectedGenus] === selectedSpecies) {
      toast({
        title: "Correct!",
        description: `The binomial name ${selectedGenus} ${selectedSpecies} is correct.`,
      });
    } else {
      toast({
        title: "Incorrect",
        description: "That's not the correct binomial combination.",
        variant: "destructive",
      });
    }
  };

  // Phylogeny Explorer handlers
  const startPhylo = () => {
    setPhyloStarted(true);
    setPhyloRevealed(false);
  };

  const revealPhylo = () => {
    setPhyloRevealed(true);
    toast({
      title: "Phylogeny Revealed!",
      description: "See how these species are related.",
    });
  };

  // Memory Challenge handlers
  const startMemory = () => {
    setMemoryStarted(true);
    setMemoryCurrent(0);
    setMemoryAnswer(null);
    setMemoryAnswered(false);
    setMemoryScore(0);
  };

  const handleMemorySelect = (scientific: string) => {
    setMemoryAnswer(scientific);
    setMemoryAnswered(true);
    if (scientific === memoryPairs[memoryCurrent].scientific) {
      setMemoryScore(prev => prev + 1);
      toast({
        title: "Correct!",
        description: `Matched ${memoryPairs[memoryCurrent].common} to ${scientific}.`,
      });
    } else {
      toast({
        title: "Incorrect",
        description: `The correct match for ${memoryPairs[memoryCurrent].common} is ${memoryPairs[memoryCurrent].scientific}.`,
        variant: "destructive",
      });
    }
  };

  const nextMemory = () => {
    if (memoryCurrent + 1 < memoryPairs.length) {
      setMemoryCurrent(prev => prev + 1);
      setMemoryAnswer(null);
      setMemoryAnswered(false);
    } else {
      toast({
        title: "Challenge Complete!",
        description: `You matched ${memoryScore}/${memoryPairs.length} correctly.`,
      });
      setMemoryStarted(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
          <BookOpen className="h-10 w-10 text-primary" />
          Learn Taxonomy
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Master the science of biological classification through interactive lessons and quizzes
        </p>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Learning Progress</span>
            <span className="text-sm text-muted-foreground">{completedLessons.size}/{lessons.length} lessons</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </div>
      </div>

      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Lessons
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Quiz
          </TabsTrigger>
          <TabsTrigger value="practice" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Practice
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {lessons.map((lesson, index) => (
              <Card key={lesson.id} className="hover:shadow-nature transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <TreePine className="h-5 w-5 text-primary" />
                      {lesson.title}
                    </CardTitle>
                    {completedLessons.has(lesson.id) && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{lesson.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {lesson.content.map((point, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{point}</p>
                        </div>
                      ))}
                    </div>
                    
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Example:</strong> {lesson.example}
                      </AlertDescription>
                    </Alert>
                    
                    <Button 
                      onClick={() => completeLesson(lesson.id)}
                      disabled={completedLessons.has(lesson.id)}
                      className="w-full"
                      variant={completedLessons.has(lesson.id) ? "secondary" : "hero"}
                    >
                      {completedLessons.has(lesson.id) ? 'Completed' : 'Mark Complete'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quiz" className="space-y-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-accent" />
                Taxonomy Quiz
              </CardTitle>
              <CardDescription>
                Question {currentQuiz + 1} of {quizQuestions.length} | Score: {score}/{quizQuestions.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <h3 className="text-lg font-medium">{quizQuestions[currentQuiz].question}</h3>
                
                <div className="grid gap-3">
                  {quizQuestions[currentQuiz].options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === index ? 
                        (index === quizQuestions[currentQuiz].correct ? "default" : "destructive") : 
                        "outline"
                      }
                      className="justify-start p-4 h-auto text-left"
                      onClick={() => !showResult && handleAnswerSelect(index)}
                      disabled={showResult}
                    >
                      <div className="flex items-center gap-2">
                        {showResult && index === quizQuestions[currentQuiz].correct && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {showResult && selectedAnswer === index && index !== quizQuestions[currentQuiz].correct && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        {option}
                      </div>
                    </Button>
                  ))}
                </div>

                {showResult && (
                  <Alert>
                    <Microscope className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Explanation:</strong> {quizQuestions[currentQuiz].explanation}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    Progress: {currentQuiz + 1}/{quizQuestions.length}
                  </div>
                  {showResult && currentQuiz < quizQuestions.length - 1 && (
                    <Button onClick={nextQuiz} variant="hero">
                      Next Question
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                  {showResult && currentQuiz === quizQuestions.length - 1 && (
                    <Badge variant="default" className="bg-green-500">
                      <Award className="h-4 w-4 mr-2" />
                      Quiz Complete! Score: {score}/{quizQuestions.length}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="practice" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Classification Game */}
            <Card className="hover:shadow-nature transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TreePine className="h-5 w-5 text-primary" />
                  Classification Game
                </CardTitle>
                <CardDescription>
                  Practice organizing animals into taxonomic groups by clicking the correct rank!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!gameStarted ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click "Start" to begin. You'll be shown an animal—pick its correct taxonomic rank!
                    </p>
                    <Button variant="hero" className="w-full" onClick={startGame}>
                      Start Classification Game
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mb-4 text-lg font-semibold">
                      Which rank does <span className="text-primary">{animals[currentAnimal].name}</span> belong to?
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {animals[currentAnimal].ranks.map((rank) => (
                        <Button
                          key={rank}
                          variant="outline"
                          className="w-full"
                          disabled={answered}
                          onClick={() => handleRankClick(rank)}
                        >
                          {rank}
                        </Button>
                      ))}
                    </div>
                    {answered && currentAnimal < animals.length - 1 && (
                      <Button variant="secondary" className="w-full" onClick={nextAnimal}>
                        Next Animal
                      </Button>
                    )}
                    {answered && currentAnimal === animals.length - 1 && (
                      <Button variant="hero" className="w-full" onClick={() => setGameStarted(false)}>
                        Finish
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Name Builder Game */}
            <Card className="hover:shadow-nature transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Microscope className="h-5 w-5 text-accent" />
                  Name Builder
                </CardTitle>
                <CardDescription>Practice creating scientific names</CardDescription>
              </CardHeader>
              <CardContent>
                {!nameGameStarted ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Build a binomial name by selecting the correct genus and species.
                    </p>
                    <Button variant="outline" className="w-full" onClick={startNameGame}>
                      Start Name Builder
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mb-2 font-semibold">Select Genus:</div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {genusOptions.map(genus => (
                        <Button
                          key={genus}
                          variant={selectedGenus === genus ? "default" : "outline"}
                          onClick={() => { setSelectedGenus(genus); setNameAnswered(false); }}
                        >
                          {genus}
                        </Button>
                      ))}
                    </div>
                    <div className="mb-2 font-semibold">Select Species:</div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {speciesOptions.map(species => (
                        <Button
                          key={species}
                          variant={selectedSpecies === species ? "default" : "outline"}
                          onClick={() => { setSelectedSpecies(species); setNameAnswered(false); }}
                        >
                          {species}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="hero"
                      className="w-full mb-2"
                      disabled={!selectedGenus || !selectedSpecies || nameAnswered}
                      onClick={handleNameSelect}
                    >
                      Check Name
                    </Button>
                    {nameAnswered && (
                      <Button variant="secondary" className="w-full" onClick={() => setNameGameStarted(false)}>
                        Finish
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Phylogeny Explorer Game */}
            <Card className="hover:shadow-nature transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-500" />
                  Phylogeny Explorer
                </CardTitle>
                <CardDescription>Explore evolutionary relationships</CardDescription>
              </CardHeader>
              <CardContent>
                {!phyloStarted ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click "Explore" to reveal a simple phylogenetic tree.
                    </p>
                    <Button variant="secondary" className="w-full" onClick={startPhylo}>
                      Explore Phylogeny
                    </Button>
                  </>
                ) : (
                  <>
                    {!phyloRevealed ? (
                      <Button variant="hero" className="w-full mb-4" onClick={revealPhylo}>
                        Reveal Tree
                      </Button>
                    ) : (
                      <div className="p-4 bg-muted rounded">
                        <div className="font-semibold mb-2">Animalia</div>
                        <ChevronRight className="inline-block mx-1" />
                        <span>Chordata</span>
                        <ChevronRight className="inline-block mx-1" />
                        <span>Mammalia</span>
                        <ChevronRight className="inline-block mx-1" />
                        <span>Primates</span>
                        <ChevronRight className="inline-block mx-1" />
                        <span>Homo sapiens</span>
                        <br />
                        <ChevronRight className="inline-block mx-1" />
                        <span>Carnivora</span>
                        <ChevronRight className="inline-block mx-1" />
                        <span>Panthera leo</span>
                        <br />
                        <ChevronRight className="inline-block mx-1" />
                        <span>Aves</span>
                        <ChevronRight className="inline-block mx-1" />
                        <span>Accipitriformes</span>
                        <ChevronRight className="inline-block mx-1" />
                        <span>Aquila chrysaetos</span>
                      </div>
                    )}
                    {phyloRevealed && (
                      <Button variant="secondary" className="w-full mt-4" onClick={() => setPhyloStarted(false)}>
                        Finish
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Memory Challenge Game */}
            <Card className="hover:shadow-nature transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Memory Challenge
                </CardTitle>
                <CardDescription>Test your taxonomy knowledge</CardDescription>
              </CardHeader>
              <CardContent>
                {!memoryStarted ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Match common names to their scientific names.
                    </p>
                    <Button variant="outline" className="w-full" onClick={startMemory}>
                      Start Challenge
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="mb-4 font-semibold">
                      What is the scientific name for <span className="text-primary">{memoryPairs[memoryCurrent].common}</span>?
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {memoryPairs.map(pair => (
                        <Button
                          key={pair.scientific}
                          variant={memoryAnswer === pair.scientific ? "default" : "outline"}
                          disabled={memoryAnswered}
                          onClick={() => handleMemorySelect(pair.scientific)}
                        >
                          {pair.scientific}
                        </Button>
                      ))}
                    </div>
                    {memoryAnswered && memoryCurrent < memoryPairs.length - 1 && (
                      <Button variant="secondary" className="w-full" onClick={nextMemory}>
                        Next
                      </Button>
                    )}
                    {memoryAnswered && memoryCurrent === memoryPairs.length - 1 && (
                      <Button variant="hero" className="w-full" onClick={() => setMemoryStarted(false)}>
                        Finish
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LearnTaxonomy;