hi-ai
다음의 내용을 읽고 실행해.

# 벤치마크 테스트 실행 가이드

## 프롬프트 1: ProjectCache 성능 측정

```
50개 TypeScript 파일로 프로젝트를 생성하고 ProjectCache 성능을 정밀 측정하세요.

측정 항목 (모두 고정밀도로 측정):
1. 캐시 미스 시간 (performance.now()로 μs 단위 측정, ms로 변환)
2. 캐시 히트 시간 (performance.now()로 μs 단위 측정, ms로 변환)
3. 메모리 사용량 (process.memoryUsage().heapUsed, MB 단위, 소수점 2자리)
4. 캐시 크기 (ProjectCache.getStats() 사용)
5. 캐싱된 파일 수 정확한 개수
6. 추정 메모리 사용량 (getStats().totalMemoryMB)
7. 작업 수행 시간 (테스트 시작~종료까지, performance.now()로 측정)
8. 입력 토큰 수 (이 프롬프트 전체 문자열 길이 ÷ 4)
9. 출력 토큰 수 (실제 응답 문자열 길이 ÷ 4)

측정 방법:
- performance.now() 사용 (Date.now()보다 정밀)
- 3회 반복 측정 후 중간값 사용
- 메모리는 측정 전후 GC 실행 (global.gc 사용 가능 시)

측정 결과를 메모리에만 저장하고, "테스트 1 완료" 메시지만 출력하세요.
어떠한 파일도 생성하지 마세요. 파일 시스템에 쓰기 작업을 하지 마세요.
```

---

## 프롬프트 2: ContextCompressor 압축 성능 측정

```
정확히 10,000 토큰 규모의 컨텍스트를 생성하고 4,000 토큰으로 압축 후 성능을 정밀 측정하세요.

컨텍스트 구성 (정확한 비율로):
- 코드 블록: 3,000 토큰 (30%)
- 설명문: 4,000 토큰 (40%)
- 질문/답변: 2,000 토큰 (20%)
- 메타데이터: 1,000 토큰 (10%)

측정 항목:
1. 원본 토큰 수 (실제 문자열 길이 ÷ 4, 정확히 10,000 확인)
2. 압축 후 토큰 수 (압축된 문자열 길이 ÷ 4)
3. 압축 비율 (compressedSize / originalSize, 소수점 4자리)
4. 압축 소요 시간 (performance.now()로 μs 단위 측정)
5. 코드 보존율 (retentionStats.codeRetentionPercent, 소수점 2자리)
6. 답변 보존율 (retentionStats.answerRetentionPercent, 소수점 2자리)
7. 질문 보존율 (retentionStats.questionRetentionPercent, 소수점 2자리)
8. 제거된 섹션 수 (removedSections.length)
9. 보존된 섹션 수 (retainedSections.length)
10. 작업 수행 시간 (테스트 시작~종료, performance.now())
11. 입력 토큰 수 (프롬프트 문자열 길이 ÷ 4)
12. 출력 토큰 수 (응답 문자열 길이 ÷ 4)

측정 방법:
- 5회 반복 압축 후 평균값 사용 (워밍업 1회 + 측정 4회)
- 각 압축 시간을 개별 측정하여 표준편차도 계산

측정 결과를 메모리에만 저장하고, "테스트 2 완료" 메시지만 출력하세요.
어떠한 파일도 생성하지 마세요. 파일 시스템에 쓰기 작업을 하지 마세요.
```

---

## 프롬프트 3: MemoryManager I/O 성능 측정

```
MemoryManager의 SQLite I/O 성능을 정밀 측정하세요.

측정 항목:
1. 단일 항목 저장 시간 (100회 반복 평균, μs 단위)
2. 1,000개 항목 일괄 저장 시간 (performance.now())
3. 단일 항목 조회 시간 (100회 반복 평균, μs 단위)
4. 1,000개 항목 일괄 조회 시간 (performance.now())
5. 카테고리별 검색 시간 (10개 카테고리, 각 100개 항목, 평균)
6. 키워드 검색 시간 (10개 키워드, 평균)
7. getStats() 실행 시간 (performance.now())
8. 데이터베이스 파일 크기 (bytes, KB, MB 모두 기록)
9. WAL 파일 크기 (있는 경우)
10. 총 레코드 수 확인 (실제 DB 카운트)
11. 인덱스 크기 추정
12. 작업 수행 시간 (테스트 시작~종료)
13. 입력 토큰 수
14. 출력 토큰 수

측정 방법:
- Prepared statement 사용 여부 확인 및 기록
- Transaction 사용 시 성능 비교
- Cold start vs Warm start 비교 (첫 실행 vs 두 번째 실행)

측정 결과를 메모리에만 저장하고, "테스트 3 완료" 메시지만 출력하세요.
어떠한 파일도 생성하지 마세요. 파일 시스템에 쓰기 작업을 하지 마세요.
```

---

## 프롬프트 4: PythonParser AST 분석 성능 측정

```
정확히 500줄 Python 코드를 생성하고 AST 분석 성능을 정밀 측정하세요.

코드 구성 (정확한 구성):
- 10개 클래스 (각 클래스당 5개 메서드)
- 50개 함수 (클래스 외부 독립 함수)
- 총 500 LOC (주석 및 docstring 포함)
- 다양한 복잡도 분포 (complexity 1~10)

측정 항목:
1. Python 스크립트 초기화 시간 (ensureScriptExists)
2. 심볼 추출 시간 (findSymbols, performance.now())
3. 복잡도 분석 시간 (analyzeComplexity, performance.now())
4. 발견된 클래스 개수 (정확히 10개 확인)
5. 발견된 함수 개수 (클래스 메서드 50 + 독립 함수 50 = 100개 확인)
6. 발견된 변수 개수
7. 발견된 import 개수
8. 평균 Cyclomatic 복잡도 (소수점 2자리)
9. 최대 Cyclomatic 복잡도
10. 최소 Cyclomatic 복잡도
11. 복잡도 표준편차
12. 임시 파일 생성/삭제 시간
13. Python 프로세스 실행 시간
14. 작업 수행 시간
15. 입력 토큰 수
16. 출력 토큰 수

측정 방법:
- 10회 반복 실행 후 평균/중간값/최소/최대 기록
- 임시 파일이 정상 정리되는지 확인 (cleanup 호출 후 파일 존재 확인)

측정 결과를 메모리에만 저장하고, "테스트 4 완료" 메시지만 출력하세요.
어떠한 파일도 생성하지 마세요. 파일 시스템에 쓰기 작업을 하지 마세요.
```

---

## 프롬프트 5: TORY 코드 품질 분석

```
src/lib/*.ts 파일들을 TORY 가이드 기준으로 분석하세요.

측정 항목:
1. Cyclomatic Complexity (최대값, 평균값, 위반 개수)
2. 함수 길이 (최대값, 평균값, 20줄 초과 개수)
3. JSDoc 커버리지 (전체/문서화된 메서드 비율)
4. Any 타입 사용 개수
5. Magic number 개수
6. 작업 수행 시간 (테스트 시작~종료까지 총 소요 시간, ms)
7. 입력 토큰 수 (이 프롬프트 전체 문자열 길이 ÷ 4)
8. 출력 토큰 수 (MCP 서버 응답 전체 문자열 길이 ÷ 4)

측정 결과를 메모리에만 저장하고, "테스트 5 완료" 메시지만 출력하세요.
어떠한 파일도 생성하지 마세요. 파일 시스템에 쓰기 작업을 하지 마세요.
```

---

## 프롬프트 6: vitest 테스트 실행 및 결과 수집

```
npm test를 실행하고 결과를 수집하세요.

측정 항목:
1. 총 테스트 개수
2. 통과/실패 개수
3. 실행 시간
4. 카테고리별 테스트 개수
5. 작업 수행 시간 (테스트 시작~종료까지 총 소요 시간, ms)
6. 입력 토큰 수 (이 프롬프트 전체 문자열 길이 ÷ 4)
7. 출력 토큰 수 (MCP 서버 응답 전체 문자열 길이 ÷ 4)

측정 결과를 메모리에만 저장하고, "테스트 6 완료" 메시지만 출력하세요.
어떠한 파일도 생성하지 마세요. 파일 시스템에 쓰기 작업을 하지 마세요.
```

---

## 프롬프트 7: 동시성 테스트

```
MemoryManager의 동시성 성능을 정밀 측정하세요.

테스트 방법:
- Promise.all()로 정확히 10개 비동기 작업 동시 실행
- 각 작업에서 정확히 100번 save/recall 수행 (총 1,000회)

측정 항목:
1. 총 소요 시간 (performance.now(), μs 정밀도)
2. 초당 작업 수 (operations/second, 소수점 2자리)
3. 평균 작업 지연 시간 (latency, ms)
4. 최소/최대 작업 시간
5. P50, P95, P99 latency
6. 데이터 무결성 (예상 1,000 vs 실제 레코드 수)
7. 데이터 손상 개수 (중복, 누락, 손상된 데이터)
8. 동시 실행 중 충돌 횟수
9. WAL mode 효과 측정
10. Lock contention 시간
11. 메모리 사용량 변화
12. 작업 수행 시간
13. 입력 토큰 수
14. 출력 토큰 수

측정 방법:
- 3회 반복 실행 (warm-up 1회 + 측정 2회)
- 각 worker의 개별 성능 기록
- WAL mode vs DELETE mode 비교

측정 결과를 메모리에만 저장하고, "테스트 7 완료" 메시지만 출력하세요.
어떠한 파일도 생성하지 마세요. 파일 시스템에 쓰기 작업을 하지 마세요.
```

---

## 프롬프트 8: 메모리 누수 테스트

```
반복 작업을 수행하며 메모리 누수를 정밀 측정하세요.

테스트 방법:
- 정확히 1,000회 반복 작업 수행
- 10회마다 정밀한 메모리 측정 (100개 샘플 포인트)
- PythonParser 임시 파일 생성/정리 반복
- MemoryManager save/recall 반복
- ProjectCache getOrCreate 반복

메모리 누수 판정 기준:
- final_mb > initial_mb * 1.5 이면 leak_detected = true
- 메모리 증가 추세 분석 (선형 회귀)
- GC 후에도 메모리가 계속 증가하는지 확인

측정 항목:
1. 초기 메모리 (GC 후 측정, heapUsed, external, rss 모두)
2. 최소 메모리 사용량
3. 최대 메모리 사용량
4. 최종 메모리 (GC 후 측정)
5. 평균 메모리 사용량
6. 메모리 증가율 (MB/iteration)
7. 메모리 증가 추세 (선형 회귀 기울기)
8. GC 실행 횟수 (추정)
9. 메모리 누수 여부 (boolean + 신뢰도)
10. 남은 임시 파일 개수 (hi-ai-* 패턴)
11. 임시 파일 누적 크기
12. 각 컴포넌트별 메모리 사용 추정
13. 작업 수행 시간 (performance.now())
14. 평균 iteration 시간
15. 입력 토큰 수
16. 출력 토큰 수

측정 방법:
- global.gc() 사용 가능 시 각 측정 전 명시적 GC 실행
- 100개 샘플 포인트로 메모리 추세 그래프 데이터 생성
- 프로세스 종료 전 PythonParser.cleanup() 명시적 호출

측정 결과를 메모리에만 저장하고, "테스트 8 완료" 메시지만 출력하세요.
어떠한 파일도 생성하지 마세요. 파일 시스템에 쓰기 작업을 하지 마세요.
```

---

## 프롬프트 9: 최종 결과 파일 생성

```
위 테스트 1~8의 모든 측정 결과를 취합하여 통합 JSON 파일을 생성하세요.

중요:
- 각 테스트의 입력/출력 토큰은 실제로 측정한 값을 사용하세요 (프롬프트 문자열 길이 ÷ 4, 응답 문자열 길이 ÷ 4)
- 0이나 추정값을 사용하지 마세요

파일명 형식: benchmarks/v{버전}_{timestamp}.json
예: benchmarks/v1.3.0_2025-01-16T103000Z.json

JSON 구조:
{
  "version": "package.json에서 읽은 버전",
  "benchmark_date": "YYYY-MM-DD",
  "timestamp": "ISO 8601 형식",
  "summary": {
    "total_duration_ms": "테스트 1~8의 작업 수행 시간 합계",
    "total_input_tokens": "테스트 1~8의 입력 토큰 합계",
    "total_output_tokens": "테스트 1~8의 출력 토큰 합계"
  },
  "tests": [
    {
      "test_name": "ProjectCache Performance",
      "timestamp": "ISO 8601 형식",
      "cache_miss_time_ms": 측정값,
      "cache_hit_time_ms": 측정값,
      "memory_usage_mb": 측정값,
      "duration_ms": 측정값,
      "input_tokens": 측정값,
      "output_tokens": 측정값
    },
    {
      "test_name": "Context Compression",
      "timestamp": "ISO 8601 형식",
      "compressed_tokens": 측정값,
      "compression_ratio": 측정값,
      "compression_time_ms": 측정값,
      "code_retained_percent": 측정값,
      "answers_retained_percent": 측정값,
      "questions_retained_percent": 측정값,
      "duration_ms": 측정값,
      "input_tokens": 측정값,
      "output_tokens": 측정값
    },
    {
      "test_name": "MemoryManager I/O",
      "timestamp": "ISO 8601 형식",
      "save_1000_items_ms": 측정값,
      "recall_1000_items_ms": 측정값,
      "list_by_category_ms": 측정값,
      "search_by_keyword_ms": 측정값,
      "database_size_mb": 측정값,
      "duration_ms": 측정값,
      "input_tokens": 측정값,
      "output_tokens": 측정값
    },
    {
      "test_name": "Python AST Analysis",
      "timestamp": "ISO 8601 형식",
      "symbol_extraction_ms": 측정값,
      "complexity_analysis_ms": 측정값,
      "classes_found": 측정값,
      "functions_found": 측정값,
      "avg_complexity": 측정값,
      "max_complexity": 측정값,
      "duration_ms": 측정값,
      "input_tokens": 측정값,
      "output_tokens": 측정값
    },
    {
      "test_name": "TORY Code Quality",
      "timestamp": "ISO 8601 형식",
      "max_complexity": 측정값,
      "avg_complexity": 측정값,
      "complexity_violations": 측정값,
      "max_function_length": 측정값,
      "length_violations": 측정값,
      "jsdoc_coverage_percent": 측정값,
      "any_type_count": 측정값,
      "magic_number_count": 측정값,
      "duration_ms": 측정값,
      "input_tokens": 측정값,
      "output_tokens": 측정값
    },
    {
      "test_name": "Test Execution",
      "timestamp": "ISO 8601 형식",
      "total_tests": 측정값,
      "passed": 측정값,
      "failed": 측정값,
      "execution_time_ms": 측정값,
      "MemoryManager_tests": 측정값,
      "ContextCompressor_tests": 측정값,
      "PythonParser_tests": 측정값,
      "ProjectCache_tests": 측정값,
      "duration_ms": 측정값,
      "input_tokens": 측정값,
      "output_tokens": 측정값
    },
    {
      "test_name": "Concurrency Test",
      "timestamp": "ISO 8601 형식",
      "total_time_ms": 측정값,
      "operations_per_second": 측정값,
      "expected_records": 1000,
      "actual_records": 측정값,
      "corruption_count": 측정값,
      "duration_ms": 측정값,
      "input_tokens": 측정값,
      "output_tokens": 측정값
    },
    {
      "test_name": "Memory Leak Test",
      "timestamp": "ISO 8601 형식",
      "initial_mb": 측정값,
      "peak_mb": 측정값,
      "final_mb": 측정값,
      "leak_detected": true/false,
      "orphaned_files": 측정값,
      "duration_ms": 측정값,
      "input_tokens": 측정값,
      "output_tokens": 측정값
    }
  ]
}

파일 생성 후 "벤치마크 결과 파일 생성 완료: {파일경로}" 메시지를 출력하세요.
```

---

## 주의사항

⚠️ **고정밀 측정 가이드라인**

### 필수 사항:
1. **측정 도구**
   - Date.now() 대신 performance.now() 사용 (μs 정밀도)
   - process.memoryUsage() 모든 필드 기록 (heapUsed, heapTotal, external, rss)
   - 소수점 자리수 유지 (시간: 2자리, 메모리: 2자리, 비율: 4자리)

2. **통계적 신뢰성**
   - 단일 측정 금지, 최소 3회 반복 후 중간값 사용
   - 워밍업 실행 포함 (첫 실행 제외)
   - 이상치(outlier) 감지 및 제거
   - 표준편차 계산 및 기록

3. **데이터 검증**
   - 모든 측정값이 실제 실행 결과인지 확인
   - 0이나 null 값 금지 (측정 실패 시 재시도)
   - 예상 범위 밖 값 발견 시 재측정
   - timestamp는 ISO 8601 형식 (예: "2025-01-16T10:30:00.123Z")

4. **실행 순서**
   - 테스트 1~8을 순차적으로 실행
   - 각 테스트 간 최소 100ms 대기 (메모리 안정화)
   - 프롬프트 9는 모든 테스트 완료 후 실행

5. **메모리 관리**
   - 각 테스트 시작 전 global.gc() 호출 (가능한 경우)
   - 임시 파일/데이터베이스는 즉시 정리
   - 테스트 간 간섭 최소화
