// Common misspellings for frequent English words
const commonMisspellings: Record<string, string[]> = {
  "the": ["teh", "hte", "te", "tthe"],
  "and": ["adn", "nad", "annd", "an"],
  "that": ["taht", "tht", "thta", "tat"],
  "have": ["ahve", "hve", "haev", "habe"],
  "for": ["fro", "fo", "forr", "fer"],
  "not": ["ont", "nto", "nott", "nat"],
  "with": ["wiht", "wth", "witth", "whit"],
  "this": ["tihs", "ths", "thsi", "tis"],
  "from": ["form", "frm", "fomr", "frum"],
  "they": ["tehy", "thye", "tey", "tthey"],
  "would": ["wuold", "wold", "wouuld", "wuld"],
  "there": ["theer", "ther", "tehre", "thre"],
  "their": ["thier", "thir", "theri", "ther"],
  "what": ["waht", "wht", "whta", "wat"],
  "which": ["whcih", "wich", "whihc", "wich"],
  "when": ["wehn", "whn", "wheen", "wen"],
  "were": ["wrer", "wre", "weer", "whre"],
  "will": ["wlil", "wll", "willl", "wiil"],
  "more": ["mroe", "mor", "moer", "morre"],
  "about": ["aobut", "abut", "abuot", "abotu"],
};

// Common punctuation errors
const punctuationErrors: Record<string, string[]> = {
  ".": ["", ",", "!", "?", ".."],
  ",": ["", ".", ";", ":"],
  "!": ["", ".", "?", "!!"],
  "?": ["", ".", "!", "??"],
  ";": ["", ":", ",", "."],
  ":": ["", ";", "."],
  "'": ["", "`"],
};

// Function to create spelling errors with different types
const createSpellingError = (word: string): string => {
  if (word.length <= 2) return word; // Don't modify very short words
  
  // Choose error type: 0 = omission, 1 = insertion, 2 = substitution, 3 = transposition, 4 = common misspelling
  const errorTypes = [];
  
  // Always check common misspellings first
  const lowercaseWord = word.toLowerCase();
  if (commonMisspellings[lowercaseWord]) {
    errorTypes.push(4);
  }
  
  // Add other error types if word is long enough
  if (word.length > 3) {
    errorTypes.push(0, 1, 2, 3);
  } else if (word.length === 3) {
    errorTypes.push(1, 2); // For 3-letter words, only do insertion or substitution
  }
  
  // Select an error type
  const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
  
  // Apply the selected error type
  switch (errorType) {
    case 0: // Omission (leaving out letters)
      const posToOmit = Math.floor(Math.random() * (word.length - 1)) + 1; // Don't omit first letter
      return word.substring(0, posToOmit) + word.substring(posToOmit + 1);
      
    case 1: // Insertion (adding extra letters)
      const posToInsert = Math.floor(Math.random() * word.length);
      const extraChars = 'abcdefghijklmnoprstuvwxyz';
      const charToInsert = extraChars[Math.floor(Math.random() * extraChars.length)];
      return word.substring(0, posToInsert) + charToInsert + word.substring(posToInsert);
      
    case 2: // Substitution (replacing letters)
      const posToSubstitute = Math.floor(Math.random() * word.length);
      const replaceChars = 'abcdefghijklmnoprstuvwxyz';
      let charToSubstitute = replaceChars[Math.floor(Math.random() * replaceChars.length)];
      // Ensure we're not replacing with the same letter
      while (charToSubstitute === word[posToSubstitute].toLowerCase()) {
        charToSubstitute = replaceChars[Math.floor(Math.random() * replaceChars.length)];
      }
      return word.substring(0, posToSubstitute) + charToSubstitute + word.substring(posToSubstitute + 1);
      
    case 3: // Transposition (reversing order of letters)
      if (word.length <= 3) return word; // Avoid for very short words
      const posToTranspose = Math.floor(Math.random() * (word.length - 2)) + 1; // Avoid first letter
      return word.substring(0, posToTranspose) + 
             word[posToTranspose + 1] + 
             word[posToTranspose] + 
             word.substring(posToTranspose + 2);
            
    case 4: // Common misspelling
      const misspellings = commonMisspellings[lowercaseWord];
      const misspelled = misspellings[Math.floor(Math.random() * misspellings.length)];
      // Preserve original capitalization
      return word[0] === word[0].toUpperCase() 
        ? misspelled.charAt(0).toUpperCase() + misspelled.slice(1)
        : misspelled;
      
    default:
      return word; // No change
  }
};

// Split HTML content into text and non-text parts
export const parseHtml = (html: string) => {
  // Simple regex to split HTML, preserving tags and text content separately
  const parts: string[] = [];
  let currentPosition = 0;
  let isInTag = false;
  let currentPart = "";

  for (let i = 0; i < html.length; i++) {
    const char = html[i];
    
    if (char === "<") {
      if (currentPart) {
        parts.push(currentPart);
        currentPart = "";
      }
      isInTag = true;
      currentPart += char;
    } else if (char === ">") {
      currentPart += char;
      parts.push(currentPart);
      currentPart = "";
      isInTag = false;
    } else {
      currentPart += char;
    }
  }

  if (currentPart) {
    parts.push(currentPart);
  }

  return parts.map(part => ({
    isTag: part.startsWith("<") && part.endsWith(">"),
    content: part
  }));
};

// Interface for corruption settings
export interface CorruptionSettings {
  spelling: number;
  punctuation: number;
  missingText: number;
}

// Interface for corruption results
export interface CorruptionResult {
  plainVersion: string;
  markedVersion: string;
  errorCounts: {
    spelling: number;
    punctuation: number;
    missingText: number;
  }
}

// Function to corrupt text based on percentage
export const corruptText = (
  content: string, 
  settings: CorruptionSettings
): CorruptionResult => {
  const parts = parseHtml(content);
  
  let plainResult = "";
  let markedResult = "";
  
  // Track error counts
  const errorCounts = {
    spelling: 0,
    punctuation: 0,
    missingText: 0
  };
  
  // Get only text parts to calculate total text length for distribution curve
  const textParts = parts.filter(part => !part.isTag);
  const totalTextLength = textParts.reduce((sum, part) => sum + part.content.length, 0);
  let textProcessedLength = 0;

  parts.forEach(part => {
    if (part.isTag) {
      // Preserve HTML tags unchanged
      plainResult += part.content;
      markedResult += part.content;
    } else {
      // Process only text content for corruption
      const words = part.content.split(/(\s+)/).filter(Boolean);
      
      words.forEach((word, index) => {
        const isWhitespace = /^\s+$/.test(word);
        
        // Don't corrupt whitespace
        if (isWhitespace) {
          plainResult += word;
          markedResult += word;
          return;
        }
        
        // Calculate position in text (0 to 1)
        textProcessedLength += word.length;
        const relativePosition = textProcessedLength / totalTextLength;
        
        // Use a bell curve distribution - fewer errors at beginning and end
        // Formula creates higher probabilities in the middle (around 0.5) and lower at the edges (0 and 1)
        const distributionFactor = 4 * relativePosition * (1 - relativePosition);
        
        // Adjust corruption settings based on position
        const adjustedSettings = {
          spelling: settings.spelling * distributionFactor,
          punctuation: settings.punctuation * distributionFactor,
          missingText: settings.missingText * distributionFactor
        };
        
        // Determine type of corruption based on adjusted settings
        const corruptionType = determineCorruptionType(adjustedSettings);
        
        // If no corruption, keep the word as is
        if (corruptionType === -1) {
          plainResult += word;
          markedResult += word;
          return;
        }
        
        // Simple word with potential punctuation at end
        const matches = word.match(/^(\w+)([^\w]*)$/);
        const wordOnly = matches ? matches[1].toLowerCase() : word.toLowerCase();
        const punctuation = matches ? matches[2] : "";
        
        switch (corruptionType) {
          case 0: // Spelling error
            if (wordOnly.length > 2) {
              const misspelled = createSpellingError(matches ? matches[1] : word);
              
              plainResult += misspelled + punctuation;
              markedResult += `<span class="spelling-error">${misspelled}</span>${punctuation}`;
              errorCounts.spelling++;
            } else {
              plainResult += word;
              markedResult += word;
            }
            break;
            
          case 1: // Punctuation error
            if (punctuation && punctuationErrors[punctuation]) {
              const errors = punctuationErrors[punctuation];
              const errorPunctuation = errors[Math.floor(Math.random() * errors.length)];
              
              plainResult += wordOnly + errorPunctuation;
              markedResult += wordOnly + `<span class="punctuation-error">${errorPunctuation}</span>`;
              errorCounts.punctuation++;
            } else if (!punctuation && Math.random() > 0.5) {
              // Add random punctuation where there was none
              const randomPunct = [",", ".", ";", ":"][Math.floor(Math.random() * 4)];
              
              plainResult += wordOnly + randomPunct;
              markedResult += wordOnly + `<span class="punctuation-error">${randomPunct}</span>`;
              errorCounts.punctuation++;
            } else {
              plainResult += word;
              markedResult += word;
            }
            break;
            
          case 2: // Word removal
            plainResult += "";
            markedResult += `<span class="missing-text">&lt;Missing Text&gt;</span>`;
            errorCounts.missingText++;
            break;
            
          default:
            plainResult += word;
            markedResult += word;
        }
      });
    }
  });

  // Random chance to remove entire sentences (only if missing text percentage is high)
  if (settings.missingText > 50) {
    const sentences = plainResult.split(/(?<=[.!?])\s+/);
    
    if (sentences.length > 2 && Math.random() * 100 < settings.missingText / 2) {
      // Skip first and last sentences, only remove from middle
      if (sentences.length > 3) {
        const sentenceToRemove = 1 + Math.floor(Math.random() * (sentences.length - 2));
        
        // Create versions with a sentence removed
        plainResult = sentences.filter((_, i) => i !== sentenceToRemove).join(" ");
        
        // In marked version, replace the sentence with a missing indicator
        markedResult = sentences.map((sentence, i) => 
          i === sentenceToRemove 
            ? `<span class="missing-text">&lt;Missing Sentence&gt;</span> `
            : sentence + " "
        ).join("");
        
        errorCounts.missingText++;
      }
    }
  }

  return { 
    plainVersion: plainResult, 
    markedVersion: markedResult,
    errorCounts
  };
};

// Helper function to determine which type of corruption to apply based on settings
function determineCorruptionType(settings: CorruptionSettings): number {
  // Roll for each type of corruption based on its percentage
  const spellingRoll = Math.random() * 100;
  const punctuationRoll = Math.random() * 100;
  const missingTextRoll = Math.random() * 100;
  
  // Create an array of eligible corruption types
  const eligibleTypes: number[] = [];
  
  if (spellingRoll < settings.spelling) {
    eligibleTypes.push(0);
  }
  
  if (punctuationRoll < settings.punctuation) {
    eligibleTypes.push(1);
  }
  
  if (missingTextRoll < settings.missingText) {
    eligibleTypes.push(2);
  }
  
  // If no corruption types are eligible, return -1 (no corruption)
  if (eligibleTypes.length === 0) {
    return -1;
  }
  
  // Randomly select from eligible corruption types
  return eligibleTypes[Math.floor(Math.random() * eligibleTypes.length)];
}
