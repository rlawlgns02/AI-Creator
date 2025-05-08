document.addEventListener('DOMContentLoaded', () => {
  // UI 요소들 가져오기
  const demoSteps = document.querySelectorAll('.demo-step-indicator');
  const demoPanes = document.querySelectorAll('.demo-pane');
  // 각 패널 안의 버튼 선택자를 더 명확하게 지정
  const nextStepButtons = document.querySelectorAll('.demo-pane .next-step-button');
  const prevStepButtons = document.querySelectorAll('.demo-pane .prev-step-button');

  const modelCards = document.querySelectorAll('.model-selection-grid .model-card');
  const dataOptionCards = document.querySelectorAll('.data-setup-options .data-option-card');
  const dataSourceContents = document.querySelectorAll('.data-source-content');
  const dataUploadInput = document.getElementById('data-upload-input');
  const uploadedFileNameDisplay = document.getElementById('uploaded-file-name');
  const recommendedDatasetsList = document.getElementById('recommended-datasets-list');

  // 3단계 관련 요소들 가져오기
  const trainingSection = document.querySelector('.training-section');
  const deploymentSection = document.querySelector('.deployment-section');
  // trainingSection이 있는지 확인 후 하위 요소 가져오기
  const trainingProgressBar = trainingSection ? trainingSection.querySelector('.training-progress-bar .progress') : null;
  const trainingStatus = trainingSection ? trainingSection.querySelector('#training-status') : null;
  const startTrainingButton = trainingSection ? trainingSection.querySelector('.start-training-button') : null;
  const retrainButton = deploymentSection ? deploymentSection.querySelector('.retrain-button') : null; // 추가 학습 버튼

  // 선택 정보 표시 요소 가져오기
  const selectedModelNameDisplay = document.getElementById('selected-model-name');
  const finalModelNameDisplay = document.getElementById('final-model-name');
  const finalDataNameDisplay = document.getElementById('final-data-name');

  // 상태 변수 초기화
  let currentStep = 1;
  let selectedModel = null; // { name: '...', type: '...', icon: '...' } 형태로 저장 (아이콘은 선택 사항)
  let selectedDataSource = 'upload'; // 기본값 설정
  let selectedDataset = null; // 파일 객체 또는 데이터셋 이름 문자열
    
  // 가상 추천 데이터셋 목록 (실제 데이터 연동은 백엔드 필요)
  const recommendedDatasets = {
      'classification': [
          { name: '이미지넷 서브셋 (1000 클래스)', description: '다양한 사물 이미지 데이터' },
          { name: '한국어 뉴스 기사 카테고리 분류 데이터', description: '정치, 경제, 사회 등 뉴스 분류 데이터' },
          { name: '스팸 메일 분류 데이터셋', description: '정상/스팸 메일 텍스트 데이터' }
      ],
      'prediction': [
          { name: '과거 주식 시세 데이터 (가상)', description: '특정 종목의 과거 주가 및 거래량 데이터' },
          { name: '지역별 날씨 시계열 데이터', description: '과거 온도, 습도, 강수량 등 데이터' },
          { name: '온라인 쇼핑몰 판매 데이터 (수요 예측)', description: '일별/주별 상품 판매량 기록' }
      ],
      'dialogue': [
          { name: '챗봇 질의응답 데이터 (FAQ)', description: '자주 묻는 질문과 답변 쌍 데이터' },
          { name: '일상 대화 스크립트', description: '자유로운 대화체 텍스트 데이터' },
          { name: '고객 문의 기록 (텍스트)', description: '서비스 이용 관련 고객 문의 내역' }
      ],
       'clustering': [
          { name: '온라인 쇼핑몰 고객 구매 데이터', description: '고객별 구매 기록, 방문 패턴 등' },
          { name: '영화 추천 시스템 사용자 평점 데이터', description: '사용자의 영화 평점 및 시청 기록' },
          { name: '뉴스 기사 토픽 모델링용 데이터', description: '기사 텍스트를 주제별로 그룹화하기 위한 데이터' }
      ],
       'object-detection': [
          { name: 'COCO 데이터셋 (일부)', description: '다양한 객체가 라벨링된 이미지 데이터' },
          { name: '자율주행 차량 이미지 데이터', description: '도로, 차량, 보행자 등이 포함된 주행 환경 이미지' },
          { name: 'CCTV 감시 영상 샘플', description: '보안 및 모니터링을 위한 객체 감지 영상' }
      ],
       'generation': [
          { name: '유명인 얼굴 이미지 데이터셋 (CelebA)', description: '다양한 유명인 얼굴 이미지' },
          { name: '예술 작품 이미지 데이터', description: '유화, 수채화 등 다양한 스타일의 이미지' },
          { name: '소설/스토리 생성용 텍스트 데이터', description: '다양한 장르의 스토리 텍스트' }
      ]
  };


  // UI 업데이트 함수 (display 속성으로 제어)
  function updateDemoUI() {
      // 스텝 인디케이터 업데이트
      demoSteps.forEach(indicator => {
          const step = parseInt(indicator.dataset.step);
          if (step === currentStep) {
              indicator.classList.add('active');
          } else {
              indicator.classList.remove('active');
          }
      });
      
      // 데모 패널 업데이트 (display 속성으로 제어)
      demoPanes.forEach(pane => {
          const step = parseInt(pane.dataset.step);
          if (step === currentStep) {
              pane.classList.add('active'); // 활성 클래스 추가 (CSS display: block 또는 flex 적용 위함)

              // 특정 스텝 활성화 시 추가 로직
              if (currentStep === 2) {
                  updateSelectedModelDisplay();
                  renderRecommendedDatasets(); // Step 2 진입 시 추천 데이터셋 로드
                  updateDataSelectionUI(); // 데이터 소스 옵션 UI 업데이트
              } else if (currentStep === 3) {
                  updateFinalSelectionDisplay();
                  resetTrainingProcessUI(); // 학습 UI 초기화
              }

          } else {
              pane.classList.remove('active'); // 비활성 클래스 제거 (CSS display: none 적용 위함)
          }
      });

      // 네비게이션 버튼 상태 업데이트 (종속성 관리)
      updateNavigationButtonStates();
  }

  // 네비게이션 버튼 상태 업데이트 함수
  function updateNavigationButtonStates() {
      demoPanes.forEach(pane => {
           const paneStep = parseInt(pane.dataset.step);
           const nextButton = pane.querySelector('.next-step-button');
           const prevButton = pane.querySelector('.prev-step-button');

           // 현재 보고 있는 패널의 버튼만 상태 업데이트
           if (paneStep === currentStep) {
               if (nextButton) {
                   if (currentStep === 1) {
                      // 1단계: 모델이 선택되어야 다음 단계 가능
                      nextButton.disabled = !selectedModel;
                   } else if (currentStep === 2) {
                       // 2단계: 데이터가 선택되어야 학습 시작 가능 (3단계로 넘어가는 버튼)
                       let dataSelected = false;
                        if (selectedDataSource === 'upload' && selectedDataset) {
                            dataSelected = uploadedFileNameDisplay.textContent !== ''; // 파일 이름이 표시되면 선택된 것으로 간주
                        } else if (selectedDataSource === 'recommended' && selectedDataset) {
                            dataSelected = true; // 추천 데이터셋이 선택되면 선택된 것으로 간주
                        }
                        // API 연동 시 추가 조건 필요

                       nextButton.disabled = !dataSelected;
                   } else if (currentStep === 3) {
                       // 3단계의 "학습 시작" 버튼은 별도로 관리되므로, 여기서는 nextButton 처리 안 함
                       // (이 버튼은 HTML에서 제거되었으므로 이 else if 블록은 사실상 실행 안됨)
                   }
               }

               if (prevButton) {
                   // 1단계에서는 이전 단계 버튼 비활성화
                   prevButton.disabled = currentStep <= 1;
               }

               // 3단계의 '학습 시작' 버튼과 '추가 학습' 버튼은 별도로 관리
               // updateNavigationButtonStates 함수에서는 이전/다음 버튼의 상태만 주로 관리
           } else {
               // 현재 활성 패널이 아닌 다른 패널의 버튼은 상태 변경 불필요 (display: none 상태이므로)
           }
      });

       // 학습 시작 버튼과 추가 학습 버튼의 상태/표시는 startTrainingProcess, resetTrainingProcessUI, 그리고 추가 학습 로직에서 별도 관리
  }

  // 선택된 모델 이름 표시 업데이트
  function updateSelectedModelDisplay() {
       if (selectedModelNameDisplay && selectedModel) {
           // 모델 객체에 icon 속성이 있다면 아이콘도 함께 표시 (모델 카드 HTML 구조에 맞게 선택자 조정)
           const modelCardElement = document.querySelector(`.model-card[data-model="${selectedModel.type}"]`);
           const iconElement = modelCardElement ? modelCardElement.querySelector('.model-icon i') : null;
           const iconHtml = iconElement ? `<i class="${iconElement.className}" style="margin-right: 8px;"></i>` : '';

           selectedModelNameDisplay.innerHTML = `${iconHtml}${selectedModel.name}`;
       } else if (selectedModelNameDisplay) {
           selectedModelNameDisplay.textContent = '선택되지 않음';
       }
  }

  // 최종 확인 단계에 선택된 모델 및 데이터 표시 업데이트
   function updateFinalSelectionDisplay() {
       if (finalModelNameDisplay && selectedModel) {
          // 모델 객체에 icon 속성이 있다면 아이콘도 함께 표시 (모델 카드 HTML 구조에 맞게 선택자 조정)
           const modelCardElement = document.querySelector(`.model-card[data-model="${selectedModel.type}"]`);
           const iconElement = modelCardElement ? modelCardElement.querySelector('.model-icon i') : null;
           const iconHtml = iconElement ? `<i class="${iconElement.className}" style="margin-right: 8px;"></i>` : '';
           finalModelNameDisplay.innerHTML = `${iconHtml}${selectedModel.name}`;

       } else if (finalModelNameDisplay) {
           finalModelNameDisplay.textContent = '선택되지 않음';
       }

        if (finalDataNameDisplay && selectedDataset) {
           // selectedDataset이 파일 객체일 수도 있고, 문자열일 수도 있습니다.
           // 파일 객체인 경우 name 속성을 사용합니다.
           finalDataNameDisplay.textContent = typeof selectedDataset === 'string' ? selectedDataset : selectedDataset.name;
       } else if (finalDataNameDisplay) {
           finalDataNameDisplay.textContent = '선택되지 않음';
       }
   }

  // 데이터 소스 선택 UI 업데이트
  function updateDataSelectionUI() {
       dataOptionCards.forEach(card => {
           const source = card.dataset.dataSource;
           const contentPane = document.querySelector(`.data-source-content[data-data-source="${source}"]`);

           if (source === selectedDataSource) {
               card.classList.add('active');
               if (contentPane) contentPane.classList.add('active');
           } else {
               card.classList.remove('active');
               if (contentPane) contentPane.classList.remove('active');
           }
       });
       // 데이터 소스 변경 시 데이터셋 선택 초기화
       selectedDataset = null;
       uploadedFileNameDisplay.textContent = ''; // 업로드 파일명 초기화
       // 추천 데이터셋 목록 선택 상태 초기화
       if (recommendedDatasetsList) {
           recommendedDatasetsList.querySelectorAll('.dataset-item.selected').forEach(item => item.classList.remove('selected'));
       }


       // 데이터 소스 변경 시 해당 입력/선택 UI 상태도 초기화 필요
        if (selectedDataSource !== 'upload') {
            if (dataUploadInput) dataUploadInput.value = ''; // 업로드 input 초기화
        }

       updateNavigationButtonStates(); // 데이터 선택 상태 변경에 따라 버튼 업데이트
  }

  // 추천 데이터셋 목록 렌더링
  function renderRecommendedDatasets() {
      if (recommendedDatasetsList && selectedModel && recommendedDatasets[selectedModel.type]) {
          const datasets = recommendedDatasets[selectedModel.type];
          recommendedDatasetsList.innerHTML = datasets.map(dataset =>
              `<div class="dataset-item" data-dataset-name="${dataset.name}">
                  <strong>${dataset.name}</strong><br>
                  <small>${dataset.description}</small>
               </div>`
          ).join('');

          // 추천 데이터셋 항목 클릭 이벤트 리스너
          recommendedDatasetsList.querySelectorAll('.dataset-item').forEach(item => {
              item.addEventListener('click', () => {
                  recommendedDatasetsList.querySelectorAll('.dataset-item').forEach(i => i.classList.remove('selected'));
                  item.classList.add('selected');
                  selectedDataset = item.dataset.datasetName; // 데이터셋 이름 저장
                  updateNavigationButtonStates(); // 데이터 선택 완료 상태 업데이트
              });
          });
      } else if (recommendedDatasetsList) {
          recommendedDatasetsList.innerHTML = '<p>선택된 모델 유형에 대한 추천 데이터셋이 없습니다.</p>';
           selectedDataset = null; // 추천 데이터셋이 없으면 선택된 데이터셋 없음으로 설정
      }
       updateNavigationButtonStates(); // 추천 데이터셋 로딩 상태 변경 시 버튼 업데이트
  }

  // 학습 진행 UI 초기화 및 배포 섹션 숨김
  function resetTrainingProcessUI() {
       if (trainingSection && deploymentSection && trainingProgressBar && trainingStatus && startTrainingButton) {
           trainingSection.style.display = 'block'; // 학습 섹션 보이게
           deploymentSection.style.display = 'none'; // 배포 섹션 숨김

           // 학습 진행 바 및 상태 초기화
           trainingProgressBar.style.width = '0%'; // 진행 바 초기화
           // 진행 바 내부 텍스트는 사용하지 않음 (상태 텍스트에 표시)
           // trainingProgressBar.textContent = '';

           trainingProgressBar.classList.remove('retraining'); // 추가 학습 색상 클래스 제거

           trainingStatus.textContent = '학습 준비 완료. "학습 시작" 버튼을 눌러주세요.'; // 상태 텍스트 초기화
           // trainingStatus 클래스 제거 (필요시)
           // trainingStatus.classList.remove('retraining-status');

           // 학습 시작 버튼 보이게 하고 활성화
           startTrainingButton.style.display = 'inline-block';
           startTrainingButton.disabled = false;

           // 추가 학습 버튼 숨김 (초기 상태)
           if (retrainButton) retrainButton.style.display = 'none';

       }
  }


  // 가상 학습 진행 시뮬레이션 함수
  function simulateTraining(isRetraining = false) {
      if (!trainingSection || !deploymentSection || !trainingProgressBar || !trainingStatus) {
          console.error("Training UI elements missing for simulation.");
          return;
      }

      // UI 상태 설정
      deploymentSection.style.display = 'none';
      trainingSection.style.display = 'block';

      // "학습 시작" 버튼 숨김 (학습 진행 중에는 필요 없음)
      if (startTrainingButton) startTrainingButton.style.display = 'none';
      // "학습 추가로 더하기" 버튼도 숨김 (학습 진행 중에는 필요 없음)
       if (retrainButton) retrainButton.style.display = 'none';


      // 진행 바 초기화 및 색상 설정
      trainingProgressBar.style.width = '0%';
      // trainingProgressBar.textContent = ''; // 진행 바 내부 텍스트 제거 유지

      if (isRetraining) {
          trainingProgressBar.classList.add('retraining'); // 추가 학습 색상
      } else {
          trainingProgressBar.classList.remove('retraining'); // 기본 학습 색상
      }

      // 상태 텍스트 설정
      if (trainingStatus) {
           trainingStatus.textContent = `${isRetraining ? '추가 ' : ''}학습 준비 중... 0%`;
           // if (isRetraining) trainingStatus.classList.add('retraining-status'); else trainingStatus.classList.remove('retraining-status'); // 상태 텍스트 색상 변경 필요시
      }


      // 시뮬레이션 시작
      let progress = 0;
      const trainingInterval = setInterval(() => {
          progress += 10; // 10%씩 증가
          if (progress <= 100) {
              // 진행 바 업데이트
              if (trainingProgressBar) {
                   trainingProgressBar.style.width = progress + '%';
              }
              // 상태 텍스트 업데이트
              if (trainingStatus) {
                   if (progress < 100) {
                        trainingStatus.textContent = `${isRetraining ? '추가 ' : ''}학습 진행 중: ${progress}% 완료`;
                   } else {
                       // 최종 완료 메시지 (줄 바꿈 포함)
                       trainingStatus.textContent = isRetraining ?
                           '추가학습 완료되었습니다.\n너무 과한 학습은 과적합 오류를 불러올수 있습니다.' : // 줄 바꿈 문자 사용
                           '모델 학습 완료!'; // 초기 학습 완료 메시지
                   }
              }

          } else {
              clearInterval(trainingInterval);
              // 학습 완료 후 다시 배포 섹션 보여주기
              trainingSection.style.display = 'none';
              deploymentSection.style.display = 'block';

              // 진행 바 색상 클래스 제거 (다음 학습/추가 학습을 위해)
              if (trainingProgressBar) trainingProgressBar.classList.remove('retraining');
              // if (trainingStatus) trainingStatus.classList.remove('retraining-status');

               // 학습 완료 후 "추가 학습" 버튼 다시 보이게
               if (retrainButton) retrainButton.style.display = 'inline-block';


               // updateNavigationButtonStates(); // 버튼 상태 업데이트 (필요시) - 현재는 prev 버튼만 보이므로 큰 변화 없음
          }
      }, 300); // 0.3초 간격
  }


  // 이벤트 리스너 설정 시작

  // 모델 카드 클릭
  modelCards.forEach(card => {
      card.addEventListener('click', () => {
          modelCards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');

          // 모델 이름, 타입 추출 (아이콘 클래스는 HTML 구조에서 직접 가져오도록 수정)
          const modelName = card.querySelector('h4')?.textContent || '';
          const modelType = card.dataset.model || modelName; // data-model 속성 사용, 없으면 이름 사용

          selectedModel = {
              name: modelName,
              type: modelType,
              // icon 속성은 updateSelectedModelDisplay/updateFinalSelectionDisplay에서 HTML에서 직접 읽어옴
          };

          selectedDataset = null; // 모델 변경 시 데이터셋 정보 초기화
          if (uploadedFileNameDisplay) uploadedFileNameDisplay.textContent = ''; // 업로드 파일명 초기화
          if (dataUploadInput) dataUploadInput.value = ''; // 파일 input 초기화
           if (recommendedDatasetsList) {
              recommendedDatasetsList.querySelectorAll('.dataset-item.selected').forEach(item => item.classList.remove('selected'));
           }

          updateNavigationButtonStates(); // 모델 선택 완료 상태 업데이트
      });
  });

  // 데이터 소스 옵션 카드 클릭
  dataOptionCards.forEach(card => {
       card.addEventListener('click', () => {
           selectedDataSource = card.dataset.dataSource;
           updateDataSelectionUI(); // UI 업데이트 및 데이터셋 선택 초기화
       });
  });

  // 파일 업로드 input 변경 감지
   if (dataUploadInput && uploadedFileNameDisplay) {
       dataUploadInput.addEventListener('change', function() {
           if (this.files && this.files.length > 0) {
               uploadedFileNameDisplay.textContent = `선택된 파일: ${this.files[0].name}`;
               selectedDataset = this.files[0]; // 파일 객체 저장
           } else {
               uploadedFileNameDisplay.textContent = '';
               selectedDataset = null;
           }
           updateNavigationButtonStates(); // 파일 선택 변경 시 버튼 업데이트
       });
   }

  // 다음 단계 버튼 클릭
  nextStepButtons.forEach(button => {
      button.addEventListener('click', () => {
          // 버튼이 비활성화 상태가 아닐 때만 작동
          if (!button.disabled) {
               // 현재 단계의 요구사항 충족 여부는 button.disabled 상태로 이미 체크됨
              currentStep++;
              updateDemoUI(); // UI 업데이트
               // 스크롤 이동 (선택 사항)
               // document.getElementById('demo').scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      });
  });

   // 이전 단계 버튼 클릭
  prevStepButtons.forEach(button => {
      button.addEventListener('click', () => {
          // 버튼이 비활성화 상태가 아닐 때만 작동
          if (!button.disabled) {
              currentStep--;
              updateDemoUI(); // UI 업데이트
               // 스크롤 이동 (선택 사항)
               // document.getElementById('demo').scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      });
  });

  // 스텝 인디케이터 클릭 (직접 이동)
   demoSteps.forEach(indicator => {
       indicator.addEventListener('click', () => {
           const targetStep = parseInt(indicator.dataset.step);

           // 현재 스텝과 같은 스텝 클릭 시 무시
           if (targetStep === currentStep) return;

           // 뒤로 가기 (항상 허용)
           if (targetStep < currentStep) {
               currentStep = targetStep;
               updateDemoUI(); // UI 업데이트
           }
           // 앞으로 가기 (유효성 검사 필요)
           else {
               let canProceed = false;
               // 1단계에서 2단계로 이동 시 모델 선택 확인
               if (currentStep === 1 && targetStep === 2 && selectedModel) {
                   canProceed = true;
               }
               // 2단계에서 3단계로 이동 시 데이터 선택 확인
               else if (currentStep === 2 && targetStep === 3) {
                    let dataSelected = false;
                    if (selectedDataSource === 'upload' && selectedDataset) {
                        dataSelected = uploadedFileNameDisplay.textContent !== '';
                    } else if (selectedDataSource === 'recommended' && selectedDataset) {
                        dataSelected = true;
                    }
                    if (dataSelected) {
                        canProceed = true;
                    }
               }
               // 그 외의 앞으로 가기 경우는 현재 목업 범위에서 허용하지 않음 (예: 1->3 바로 이동 불가)

               if (canProceed) {
                   currentStep = targetStep;
                   updateDemoUI(); // UI 업데이트
               } else {
                   // 이동 불가 시 사용자에게 알림 (선택 사항)
                   if (currentStep === 1) {
                       alert("다음 단계로 이동하려면 모델을 선택해야 합니다.");
                   } else if (currentStep === 2) {
                        alert("다음 단계로 이동하려면 학습에 사용할 데이터를 선택하거나 업로드해야 합니다.");
                   }
                   //console.log("다음 단계로 이동하려면 현재 단계를 완료해야 합니다.");
               }
           }
            // 스크롤 이동 (선택 사항)
            // document.getElementById('demo').scrollIntoView({ behavior: 'smooth', block: 'start' });
       });
   });


  // 학습 시작 버튼 클릭
  if (startTrainingButton) {
      startTrainingButton.addEventListener('click', () => {
          if (!startTrainingButton.disabled) { // 버튼 활성화 상태 확인
               simulateTraining(false); // 초기 학습 시뮬레이션 시작
          }
      });
  }

  // 학습 추가로 더하기 버튼 클릭
  if (retrainButton) {
      retrainButton.addEventListener('click', () => {
          simulateTraining(true); // 추가 학습 시뮬레이션 시작
      });
  }


  // 초기 UI 설정
  updateDemoUI();
});