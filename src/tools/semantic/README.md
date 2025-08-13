# 시맨틱 코드 분석 도구 (Semantic Code Tools)

## 개요
Serena MCP의 LSP 기반 시맨틱 분석 기능을 Hi-AI에 통합하여 더 강력한 코드 이해 능력을 제공합니다.

## 제안 도구 목록

### 1. find_symbol
- **기능**: 프로젝트 전체에서 심볼(함수, 클래스, 변수) 검색
- **키워드**: "함수 찾아", "클래스 어디", "find function", "where is class"
- **LSP 활용**: 정확한 심볼 위치 파악

### 2. go_to_definition  
- **기능**: 심볼의 정의로 이동
- **키워드**: "정의 보여줘", "선언 위치", "go to definition", "show declaration"
- **LSP 활용**: 정확한 정의 위치 추적

### 3. find_references
- **기능**: 심볼이 사용되는 모든 위치 찾기
- **키워드**: "어디서 사용", "참조 찾기", "find usages", "show references"  
- **LSP 활용**: 프로젝트 전체 참조 분석

### 4. semantic_code_search
- **기능**: 의미 기반 코드 검색 (정규식보다 정확)
- **키워드**: "의미적으로 찾아", "시맨틱 검색", "semantic search"
- **LSP 활용**: AST 기반 의미 검색

### 5. rename_symbol
- **기능**: 프로젝트 전체에서 심볼 이름 변경
- **키워드**: "이름 바꿔", "리네임", "rename everywhere"
- **LSP 활용**: 안전한 리팩토링

### 6. extract_function
- **기능**: 코드 블록을 함수로 추출
- **키워드**: "함수로 추출", "extract method"
- **LSP 활용**: 자동 리팩토링

### 7. get_call_hierarchy
- **기능**: 함수 호출 계층 구조 분석
- **키워드**: "호출 구조", "call hierarchy", "who calls this"
- **LSP 활용**: 호출 관계 추적

### 8. get_type_info
- **기능**: 변수/표현식의 타입 정보 제공
- **키워드**: "타입 뭐야", "what type", "type info"
- **LSP 활용**: 타입 추론 및 표시

## 구현 방법

### 옵션 1: vscode-languageserver-node 활용
```typescript
import { 
  createConnection,
  TextDocuments,
  ProposedFeatures 
} from 'vscode-languageserver/node';
```

### 옵션 2: typescript-language-server 통합
```typescript
import { TypeScriptLanguageService } from 'typescript-language-server';
```

### 옵션 3: 직접 LSP 클라이언트 구현
```typescript
import { spawn } from 'child_process';
// 각 언어별 LSP 서버 실행
```

## 필요 의존성
```json
{
  "dependencies": {
    "vscode-languageserver": "^9.0.0",
    "vscode-languageserver-textdocument": "^1.0.0",
    "typescript-language-server": "^4.0.0"
  }
}
```

## 장점
1. **정확성**: 단순 텍스트 매칭이 아닌 실제 코드 의미 이해
2. **안전성**: 리팩토링 시 실수 방지
3. **생산성**: IDE 수준의 코드 탐색 기능
4. **다언어 지원**: LSP를 지원하는 모든 언어

## 기대 효과
- Hi-AI의 코드 분석 정확도 대폭 향상
- Serena의 강점 + Hi-AI의 자연어 처리 = 최강 조합
- 개발자 경험 획기적 개선