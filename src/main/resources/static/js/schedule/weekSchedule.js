let scheduleOptions;

document.addEventListener('DOMContentLoaded', function() {

      var calendarEl = document.getElementById('calendar');
      var weeklyEvents = []; // 주간 뷰 이벤트 저장
      var monthlyEvents = []; // 월간 뷰 이벤트 저장
      
      
    
      //과목명과 색상 매핑 객체
      var subjectColors = {
        '영어': '#FFF9C4',//
        '수학': '#FFD9B7',//
        '국어': '#E1BEE7',//
        '과탐': '#C1E3D6',//
        '사탐': '#C5E1A5'//
      };

      // 과목명에 따라 색상을 반환하는 함수
      function getSubjectColor(subject) {
        return subjectColors[subject] || '#F0F4C3'; // 매핑된 색상이 없을 경우 기본 색상 반환
      }
      
      //isOverlapping 함수 정의
      function isOverlapping(newEvent) {
    	  var allEvents = calendar.getEvents();
    	  for (var i = 0; i < allEvents.length; i++) {
    	    var existingEvent = allEvents[i];
    	    if (existingEvent.id === newEvent.id) {
    	      continue;  // 수정 시 자기 자신과는 비교하지 않습니다 id값이 같기 때문에 굳이 비교할 필요가 없음
    	    }
    	    
    	    // 시간 겹침 확인
    	    // 새로운 시간 시작 일정이 기존 끝나는 일정보다 빠르거나 새로운 일정 종료 시간이 기존 시작 시간보다 느릴 경우
    	    if (newEvent.start < existingEvent.end && existingEvent.start < newEvent.end) {
    	      return true;
    	    }
    	  }
    	  return false;
    	}
      
      function refreshEvents() {
    	  var currentViewType = calendar.view.type;
    	  if (currentViewType === 'dayGridMonth') {
    	    // 월간 뷰 데이터 리로드
    	    var start = calendar.view.currentStart;
    	    $.ajax({
    	      url: "/api/schedule/getMonthlyAchievement",
    	      type: "GET",
    	      dataType: "json",
    	      data: {
    	        year: start.getFullYear(),
    	        month: start.getMonth() + 1,
    	      },
    	      success: function(data) {
    	        monthlyEvents = data.map(function(dto) {
    	          return {
    	            title: dto.avgAchieveRate > 0 ? dto.avgAchieveRate.toFixed(1) + "%" : "",
    	            start: dto.date,
    	            extendedProps: {
    	              avgAchieveRate: dto.avgAchieveRate
    	            }
    	          };
    	        });
    	        calendar.removeAllEvents();
    	        calendar.addEventSource(monthlyEvents);
    	      },
    	      error: function(xhr, status, error) {
    	        console.error(error);
    	      }
    	    });
    	  } else if (currentViewType === 'timeGridWeek') {
    	    // 주간 뷰 데이터 리로드
    	    $.ajax({
    	      url: "/api/schedule/findAll", //refreshEvents
    	      type: "GET",
    	      dataType: "json",
    	      success: function(data) {
    	        weeklyEvents = data;
    	        calendar.removeAllEvents();
    	        calendar.addEventSource(weeklyEvents);
    	      },
    	      error: function(xhr, status, error) {
    	        console.error(error);
    	      }
    	    });
    	  }
    	}
    	
    	function isAnyEmpty(arr) {
		    return arr.some(item => item === null || item.trim() === "");
		}

    	
    	
		      
      var calendar = new FullCalendar.Calendar(calendarEl, {
    	
    	events: [],
   	    height: 'auto',
   	    slotMinTime: '06:00:00',
   	    slotMaxTime: '29:59:59', // 다음날 오전 6시를 의미합니다
   	    nextDayThreshold: '06:00:00',
   	    slotDuration: '00:30:00', 
    	allDaySlot: false,
        initialView: 'timeGridWeek',
        initialDate: new Date(),
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'addEventButton,dayGridMonth,timeGridWeek'
        },
        customButtons: {
          addEventButton: {
            text: "일정 추가",
            click: function() {
              $("#calendarModal").modal("show"); // 모달 나타내기
              
           	  // 추가 버튼 클릭 이벤트 핸들러 등록
              $("#addCalendar").off("click").on("click", function() {
                var startTime = $("#startTime").val();
                var endTime = $("#endTime").val();
                var studyway = $("#studyway").val(); //학업구분
                var subject = $("#subject").val(); //과목
                var material = $("#material").val(); //학습 종류
                var progress = $("#progress").val(); //진도 내역
                var achieveRate = $("#achieveRate").val(); //달성율

                //유효성 검사
                if (startTime == null || startTime == "") {
                  alert("시작 시간을 입력하세요");
                } else if (endTime == null || endTime == "") {
                  alert("종료 시간을 입력하세요");
                } else if (studyway == null || studyway == "") {
                  alert("학업 구분을 입력하세요");
                } else if (subject == null || subject == "") {
                  alert("과목을 입력하세요");
                } else if (material == null || material == "") {
                  alert("학습 종류를 입력하세요");
                } else if (progress == null || progress == "") {
                  alert("진도 내역을 입력하세요");
                } else if (achieveRate == null || achieveRate == "") {
                  alert("달성율을 입력하세요");
                } else if (new Date(endTime) - new Date(startTime) < 0) {
                  alert("종료 시간이 시작 시간보다 먼저입니다");
                } else {
                	
                 var obj = { //전송할 객체 생성
                   "startTime": startTime,
                   "endTime": endTime,
                   "studyway": studyway,
                   "subject": subject,
                   "material": material,
                   "progress": progress,
                   "achieveRate": achieveRate
                 };
                 
            	 var newEvent = {
            			    start: new Date(startTime),
            			    end: new Date(endTime)
            			  };

   			     if (isOverlapping(newEvent)) {
   			       alert("이미 일정이 있는 시간입니다. 다른 시간을 선택해 주세요.");
   			       return; //현재 실행시키고 있는 함수를 즉시 종료 대신 현재 상태는 유지 
   			     }

                  $.ajax({
                    url: "/api/schedule/add", // 데이터를 전송할 컨트롤러의 URL
                    type: "POST",
                    data: JSON.stringify(obj),
                    contentType: "application/json",
                    success: function(response) {
                      // 서버 응답 처리
                      console.log(response);
                      // 모달 창 닫기
                      $("#calendarModal").modal("hide");
                      // 캘린더 이벤트 추가 등의 동작 수행
                      refreshEvents(); // 일정 추가 후 FullCalendar 다시 렌더링
                    },
                    error: function(xhr, status, error) {
                      // 오류 처리
                      console.log(error);
                    }
                  });
                }
              });
            }
          }
        },
        eventClick:function(info){
        	
        	var view = info.view.type;
        	
	        if(view === 'timeGridWeek')	{ //주간일때 event 클릭 설정
	        
        		 var eventId = info.event.id;
               
                 $.ajax({
                     url: "/api/schedule/getDetail",
                     method: "GET",
                     dataType: "json",
                     data: { id: eventId},
                     success: function(response) {
                         console.log(response);
                         // 모달창 입력 필드에 받아온 데이터 설정
                         $("#updateModal #startTime").val(response.startTime);
                         $("#updateModal #endTime").val(response.endTime);
                         
                         // 드롭다운 선택지 초기화
              			 initializeDropdowns();
              			 
                         // 드롭다운에 받아온 데이터 선택
		                 // 드롭다운에 받아온 데이터 선택
						fillDropdown("#updateModal #studyway", scheduleOptions.studyways);
						$("#updateModal #studyway").val(response.studyway.studywayCode);
						
						fillDropdown("#updateModal #subject", scheduleOptions.subjects);
						$("#updateModal #subject").val(response.subject.subjectCode);
                         
		                // 기존 진도 내역 입력 필드 제거 (첫 번째 필드는 제외)
               			$("#updateModal #progressEntries .progress-entry:not(:first)").remove();
		
		                // 첫 번째 진도 내역 입력 필드에 데이터 설정
						if (response.progresses.length > 0) {
						    var firstProgress = response.progresses[0];
						    fillDropdown("#updateModal #progressEntries .progress-entry:first select[name='material[]']", scheduleOptions.materials, "학습종류");
						    $("#updateModal #progressEntries .progress-entry:first select[name='material[]']").val(firstProgress.material.materialCode);
						    $("#updateModal #progressEntries .progress-entry:first input[name='progress[]']").val(firstProgress.progress);
						    $("#updateModal #progressEntries .progress-entry:first input[name='achieveRate[]']").val(firstProgress.achieveRate);
						}
		
		                // 나머지 진도 내역은 동적으로 추가
						for (var i = 1; i < response.progresses.length; i++) {
						    var progress = response.progresses[i];
						    var newRow = `
						        <div class="form-row align-items-center mb-2 progress-entry">
						            <div class="col-3">
						                <label for="material${i}" class="sr-only">학습종류</label>
						                <select class="form-control" id="material${i}" name="material[]"></select>
						            </div>
						            <div class="col-6">
						                <label for="progress${i}" class="sr-only">진도 내역</label>
						                <input type="text" class="form-control" id="progress${i}" name="progress[]" placeholder="진도 내역" value="${progress.progress}">
						            </div>
						            <div class="col-2">
						                <label for="achieveRate${i}" class="sr-only">달성율</label>
						                <input type="text" class="form-control" id="achieveRate${i}" name="achieveRate[]" placeholder="0" value="${progress.achieveRate}">
						            </div>
						            <div class="col-auto">
						                <button type="button" class="btn btn-danger btn-sm remove-progress">-</button>
						            </div>
						        </div>
						    `;
						    $("#updateModal #progressEntries").append(newRow);
						    fillDropdown(`#material${i}`, scheduleOptions.materials, "학습종류");
						    $(`#material${i}`).val(progress.material.materialCode);
						}
						
						// +/- 버튼 작동하도록 이벤트 핸들러 등록
		                let progressCount = $("#updateModal #progressEntries .progress-entry").length;
		
		                $("#updateModal").on("click", ".add-progress", function() {
		                    if (progressCount < 5) {
		                        var newRow = `
		                            <div class="form-row align-items-center mb-2 progress-entry">
		                                <div class="col-3">
		                                    <label for="material${progressCount}" class="sr-only">학습종류</label>
		                                    <select class="form-control" id="material${progressCount}" name="material[]"></select>
		                                </div>
		                                <div class="col-6">
		                                    <label for="progress${progressCount}" class="sr-only">진도 내역</label>
		                                    <input type="text" class="form-control" id="progress${progressCount}" name="progress[]" placeholder="진도 내역">
		                                </div>
		                                <div class="col-2">
		                                    <label for="achieveRate${progressCount}" class="sr-only">달성율</label>
		                                    <input type="text" class="form-control" id="achieveRate${progressCount}" name="achieveRate[]" placeholder="0">
		                                </div>
		                                <div class="col-auto">
		                                    <button type="button" class="btn btn-danger btn-sm remove-progress">-</button>
		                                </div>
		                            </div>
		                        `;
		                        $("#updateModal #progressEntries").append(newRow);
		                        fillDropdown(`#material${progressCount}`, scheduleOptions.materials, "학습종류");
		                        progressCount++;
		                        
		                        if (progressCount === 5) {
						            $("#updateModal .add-progress").css("display", "none"); // "+" 버튼 숨기기
						        }
		                    }else {
						        alert("진도 내역은 최대 5개까지 입력할 수 있습니다."); // 알림 메시지 표시
						    }
		                });
		
		                $("#updateModal").on("click", ".remove-progress", function() {
		                    if (progressCount > 1) {
		                        $(this).closest(".progress-entry").remove();
		                        progressCount--;
		                    }
		                });
		                
                         // 모달창 열기
                         $("#updateModal").modal("show");
                         
                         // 일정 삭제하기
                         $("#deleteCalendar").off("click").on("click", function() {
                             if (confirm("일정을 삭제하시겠습니까?")) {
                               $.ajax({
                                 url: "/api/schedule/deleteSchedule",
                                 method: "DELETE",
                                 dataType: "json",
                                 data: { id: info.event.id },
                                 success: function(response) {
                                	 
                                   console.log(response.message);
                                   alert("일정이 삭제되었습니다");
                                   refreshEvents(); // 일정 업데이트 후 캘린더 다시 렌더링
                                   $("#updateModal").modal("hide"); // 모달 닫기
                                 },
                                 error: function(xhr, status, error) {
                                   console.log(error);
                                 }
                               });
                             }else {
                           info.revert(); // 변경 사항 되돌리기
                         }
                       });
                         
                       //일정 수정하기 
                       $("#updateCalendar").off("click").on("click", function() {
                    	   
                    	   if (confirm("일정을 수정하시겠습니까?")) {
                    		// 모달창에서 입력된 값 가져오기
                   	        var startTime = $("#updateModal #startTime").val();
                   	        var endTime = $("#updateModal #endTime").val();
                   	        var studyway = $("#updateModal #studyway").val();
                   	        var subject = $("#updateModal #subject").val();
                   	        
                   	        
                   	        var progresses = [];
					        $(".progress-entry").each(function() {
					            var material = $(this).find("select[name='material[]']").val();
					            var progress = $(this).find("input[name='progress[]']").val();
					            var achieveRate = $(this).find("input[name='achieveRate[]']").val();
					            progresses.push({
					                materialId: material,
					                progress: progress,
					                achieveRate: achieveRate
					            });
					        });
                    	
                    		// 유효성 검사
					        if (startTime == null || startTime == "") {
					            alert("시작 시간을 입력하세요");
					        } else if (endTime == null || endTime == "") {
					            alert("종료 시간을 입력하세요");
					        } else if (studyway == null || studyway == "") {
					            alert("학업 구분을 입력하세요");
					        } else if (subject == null || subject == "") {
					            alert("과목을 입력하세요");
					        } else if (progresses.some(item => item.materialId == null || item.materialId == "")) {
					            alert("모든 학습 종류를 선택하세요");
					        } else if (progresses.some(item => item.progress == null || item.progress.trim() == "")) {
					            alert("모든 진도 내역을 입력하세요");
					        } else if (progresses.some(item => item.achieveRate == null || item.achieveRate == "" || item.achieveRate < 0 || item.achieveRate > 100)) {
					            alert("달성율은 0부터 100 사이의 값을 입력하세요");
					        } else if (new Date(endTime) - new Date(startTime) < 0) {
					            alert("종료 시간이 시작 시간보다 먼저입니다");
					        } else {
	       	                	
       	                	  var updatedEvent = {
       	                		      id: info.event.id,
       	                		      start: new Date(startTime),
       	                		      end: new Date(endTime)
       	                		    };

   	                		  if (isOverlapping(updatedEvent)) {
   	                		    alert("이미 일정이 있는 시간입니다. 다른 시간을 선택해 주세요.");
   	                		    return;
   	                		  }
   	                		  
	       	                  var data = { //전송할 객체 생성
	       	                	"scheduleId" : info.event.id,
	       	                    "startTime": startTime,
	       	                    "endTime": endTime,
	       	                    "studywayId": studyway,
	       	                    "subjectId": subject,
	       	                    "progresses": progresses
	       	                  };
                             $.ajax({
                          	   url: "/api/schedule/updateSchedule",
                               method: "PATCH",
                               dataType: "json",
                               data: JSON.stringify(data),
                               contentType: 'application/json',
                               success: function(response) {
                              	 
                            	 console.log(data);
                                 console.log(response.message);
                                 alert("일정이 수정되었습니다");
                                 refreshEvents();// 일정 업데이트 후 캘린더 다시 렌더링
                                 $("#updateModal").modal("hide"); // 모달 닫기
                               },
                               error: function(xhr, status, error) {
                                 console.log(error);
                               }
                             });
	       	                }
                           }else {
                         info.revert(); // 변경 사항 되돌리기
                       }
                     });     
                     },
                     error: function(xhr, status, error) {
                         console.log(error);
                     }
                 });
	        } else if (view === 'dayGridMonth') {
	        	var date = new Date(info.event.start);
	            date.setDate(date.getDate() + 1);
	            date = date.toISOString().slice(0, 10);
	        	console.log(date);

	            $.ajax({
	                url: "/api/schedule/findByDate",
	                method: "GET",
	                dataType: "json",
	                data: { date: date },
	                success: function(response) {
	                    // 응답 데이터 처리
	                    var schedules = response;

	                    // 모달 제목 설정
	                    $('#monthlyScheduleModalLabel').text(date);

	                 // 일일평균달성율 설정
	                    var avgAchieveRate = null;

	                    // 일정 데이터 설정
	                    var tableBody = $('.schedule-table tbody');
	                    tableBody.empty();

	                    schedules.forEach(function(schedule) {
	                        if (schedule.hasOwnProperty('avgAchieveRate')) {
	                            avgAchieveRate = schedule.avgAchieveRate;
	                        } else {
	                            var row = '<tr>' +
	                                        '<td>' + schedule.studyway + '</td>' +
	                                        '<td>' + schedule.subject + '</td>' +
	                                        '<td>' + schedule.progress + '</td>' +
	                                        '<td>' + schedule.achieveRate + '%</td>' +
	                                      '</tr>';
	                            tableBody.append(row);
	                        }
	                    });

	                    if (avgAchieveRate !== null) {
	                        $('.average-achieve-rate').text('일일평균달성율: ' + avgAchieveRate + '%');
	                    } else {
	                        $('.average-achieve-rate').text('일일평균달성율: 0%');
	                    }

	                    // 모달 띄우기
	                    $('#monthlyScheduleModal').modal({
						    backdrop: false,
						    keyboard: true,
						    show: true
						});

	                },
	                error: function(xhr, status, error) {
	                    console.log(error);
	                }
	            });
	        }
        },
        dateClick: function(info) {
            var clickedDate = info.dateStr;

            $.ajax({
                url: "/api/schedule/findByDate",
                method: "GET",
                dataType: "json",
                data: { date: clickedDate },
                success: function(response) {
                    // 응답 데이터 처리
                    var schedules = response;

                    // 모달 제목 설정
                    $('#monthlyScheduleModalLabel').text(clickedDate);

                    // 일일평균달성율 설정
                    var avgAchieveRate = schedules.find(function(data) {
                        return data.hasOwnProperty('avgAchieveRate');
                    }).avgAchieveRate;
                    $('.average-achieve-rate').text('일일평균달성율: ' + avgAchieveRate + '%');

                    // 일정 데이터 설정
                    var tableBody = $('.schedule-table tbody');
                    tableBody.empty();

                    schedules.forEach(function(schedule) {
                        if (!schedule.hasOwnProperty('avgAchieveRate')) {
                            var row = '<tr>' +
                                        '<td>' + schedule.studyway + '</td>' +
                                        '<td>' + schedule.subject + '</td>' +
                                        '<td>' + schedule.progress + '</td>' +
                                        '<td>' + schedule.achieveRate + '%</td>' +
                                      '</tr>';
                            tableBody.append(row);
                        }
                    });

                 	// 모달 띄우기
                    $('#monthlyScheduleModal').modal({
					    backdrop: false,
					    keyboard: true,
					    show: true
					});

                    
                },
                error: function(xhr, status, error) {
                    console.log(error);
                }
            });
        },
        editable: false,
        droppable: true,
        selectable: true,
        locale: 'ko',
        select: function(info) { // 주간테이블 select했을 시에 일정 등록하기 
        	
			var view = info.view.type;
        	
	        if(view === 'timeGridWeek')	{ //주간일때 event 클릭 설정
        	  // 시작 시간과 종료 시간의 날짜/시간 정보 추출
        	  var startDate = new Date(info.start);
        	  var endDate = new Date(info.end);
        	  
        	  // 시간대 차이를 보정 (9시간 더하기)
        	  startDate.setHours(startDate.getHours() + 9);
        	  endDate.setHours(endDate.getHours() + 9);

        	  // 날짜/시간 정보 포맷팅
        	  var startTimeStr = startDate.toISOString().slice(0, 16);
        	  var endTimeStr = endDate.toISOString().slice(0, 16);

        	  // 모달창 입력 필드에 받아온 데이터 설정
        	  $("#calendarModal #startTime").val(startTimeStr);
        	  $("#calendarModal #endTime").val(endTimeStr);
        	  
        	  //모달창 띄우기
	          $("#calendarModal").modal("show");
	          
        	  //추가 버튼 눌렀을 때, 이벤트 핸들러 
	          $("#addCalendar").off("click").on("click", function() {
	                var startTime = $("#startTime").val();
	                var endTime = $("#endTime").val();
	                var studyway = $("#studyway").val(); //학업구분
	                var subject = $("#subject").val(); //과목
	                
	                var progressList = [];
				    $("#progressEntries .progress-entry").each(function() {
				        var materialId = $(this).find("select[name='material[]']").val();
				        var progress = $(this).find("input[name='progress[]']").val();
				        progressList.push({
				            materialId: materialId,
				            progress: progress
				        });
				     });

	                //유효성 검사
	                if (startTime == null || startTime == "") {
	                  alert("시작 시간을 입력하세요");
	                } else if (endTime == null || endTime == "") {
	                  alert("종료 시간을 입력하세요");
	                } else if (studyway == null || studyway == "") {
	                  alert("학업 구분을 입력하세요");
	                } else if (subject == null || subject == "") {
	                  alert("과목을 입력하세요");
	                } else if (progressList.length === 0) {
	                  alert("최소 하나의 학습 내용을 입력하세요");
	                } else if (progressList.some(item => item.materialId == null || item.materialId == "")) {
					  alert("모든 학습 종류를 선택하세요");
					} else if (progressList.some(item => item.progress == null || item.progress.trim() == "")) {
					  alert("모든 진도 내역을 입력하세요");
					} else if (new Date(endTime) - new Date(startTime) < 0) {
	                  alert("종료 시간이 시작 시간보다 먼저입니다");
	                } else {
   	                	
	               	 var newEvent = {
	           			     start: new Date(startTime),
	           			     end: new Date(endTime)
	           			   };

   	   			     if (isOverlapping(newEvent)) {
   	   			       alert("이미 일정이 있는 시간입니다. 다른 시간을 선택해 주세요.");
   	   			       return; //현재 실행시키고 있는 함수를 즉시 종료 대신 현재 상태는 유지 
   	   			     }
	                		  
	                  var obj = { //전송할 객체 생성
	                    "startTime": startTime,
	                    "endTime": endTime,
	                    "studywayId": studyway,
	                    "subjectId": subject,
	                    "progresses": progressList
	                  };
						console.log(obj);
	                  $.ajax({
	                    url: "/api/schedule/add", // 데이터를 전송할 컨트롤러의 URL
	                    type: "POST",
	                    data: JSON.stringify(obj),
	                    contentType: "application/json",
	                    success: function(response) {
	                      // 서버 응답 처리
	                      console.log(response);
	                      // 모달 창 닫기
	                      $("#calendarModal").modal("hide");
	                      // 캘린더 이벤트 추가 등의 동작 수행
	                      refreshEvents();// 일정 추가 후 FullCalendar 다시 렌더링
	                    },
	                    error: function(xhr, status, error) {
	                      // 오류 처리
	                      console.log(error);
	                    }
	                  });
	                }
	              });
	        }
          },
        eventDrop: function(info) {
        	
       	  if (info.view.type === 'dayGridMonth') {
       	      info.revert();
       	      return;
       	    }
        	
       	  if (isOverlapping(info.event)) {
       	      alert("이미 일정이 있는 시간입니다. 다른 시간을 선택해 주세요.");
       	      info.revert();
       	      return;
       	    }

          if (confirm("일정 시간을 수정하시겠습니까?")){
          
        	  // 시작 시간과 종료 시간의 날짜/시간 정보 추출
        	  var startDate = new Date(info.event.start);
        	  var endDate = new Date(info.event.end);
        	  
        	  // 시간대 차이를 보정 (9시간 더하기)
        	  startDate.setHours(startDate.getHours() + 9);
        	  endDate.setHours(endDate.getHours() + 9);

        	  // 날짜/시간 정보 포맷팅
        	  var startTimeStr = startDate.toISOString().slice(0, 16);
        	  var endTimeStr = endDate.toISOString().slice(0, 16);
        	  
        	  
    		  var event = info.event;
   	          var scheduleDto = {
   	               scheduleId: event.id,
   	               studyway: event.title,
   	               startTime: startTimeStr,
                   endTime: endTimeStr
    	         };
   	          
    	    console.log(scheduleDto);

    	    $.ajax({
    	      url: "/api/schedule/updateTime",
    	      method: "PATCH",
    	      dataType: "json",
    	      data: JSON.stringify(scheduleDto),
              contentType: 'application/json',
              success: function(response) {
            	  console.log(response.message);
            	  refreshEvents(); //일정 업데이트 후 캘린더 다시 렌더링
              },
              error: function(xhr, status, error) {
                  console.log(error);
              }
          });
        }else{
        	 info.revert(); // 변경 사항 되돌리기
        	}
        },
        eventResize: function(info) {
        	
        	  if (info.view.type === 'dayGridMonth') {
        	      info.revert();
        	      return;
        	    }
        	
	       	  if (isOverlapping(info.event)) {
	       	      alert("이미 일정이 있는 시간입니다. 다른 시간을 선택해 주세요.");
	       	      info.revert();
	       	      return;
	       	    }
	       	  
        	  if (confirm("일정 시간을 수정하시겠습니까?")) {
        		  
        		  // 시작 시간과 종료 시간의 날짜/시간 정보 추출
            	  var startDate = new Date(info.event.start);
            	  var endDate = new Date(info.event.end);
            	  
            	  // 시간대 차이를 보정 (9시간 더하기)
            	  startDate.setHours(startDate.getHours() + 9);
            	  endDate.setHours(endDate.getHours() + 9);

            	  // 날짜/시간 정보 포맷팅
            	  var startTimeStr = startDate.toISOString().slice(0, 16);
            	  var endTimeStr = endDate.toISOString().slice(0, 16);
            	  
            	  
        		  var event = info.event;
       	          var scheduleDto = {
       	               scheduleId: event.id,
       	               studyway: event.title,
       	               startTime: startTimeStr,
                       endTime: endTimeStr
        	         };
       	          
        	    console.log(scheduleDto);

        	    $.ajax({
        	      url: "/api/schedule/updateTime",
        	      method: "PATCH",
        	      dataType: "json",
        	      data: JSON.stringify(scheduleDto),
        	      contentType: 'application/json',
        	      success: function(response) {
        	        console.log(response);
        	        //calendar.refetchEvents() 으로는 비동기 업데이트가 진행되지 않음 
        	        refreshEvents(); // 일정 업데이트 후 캘린더 다시 렌더링
        	      },
        	      error: function(xhr, status, error) {
        	        console.log(error);
        	      }
        	    });
        	  } else {
        	    info.revert(); // 변경 사항 되돌리기
        	  }
        	},
       	eventDidMount: function(info) {
       	      var event = info.event;
       	      var eventSubject = event.extendedProps ? event.extendedProps.subject : null; // 일정 데이터에서 과목명 가져오기
       	      var eventColor = getSubjectColor(eventSubject);

       	      info.el.style.backgroundColor = eventColor; // 일정 칸의 배경색 설정
       	      info.el.style.borderColor = 'white'; // 일정 칸의 보더 색상을 흰색으로 설정
       	      
       	      
       	      // 현재 뷰가 월간 뷰인지 확인
       	    if (info.view.type === 'dayGridMonth') {
       	        var avgAchieveRate = info.event.extendedProps.avgAchieveRate || 0;
       	        if (avgAchieveRate > 0) {
       	            // 달성율이 0보다 큰 경우 배경색 설정
       	            info.el.style.backgroundColor = 'transparent';
       	            info.el.style.borderColor = 'transparent';
       	        } else {
       	            // 달성율이 0인 경우 투명하게 설정
       	            info.el.style.backgroundColor = 'transparent';
       	            info.el.style.borderColor = 'transparent';
       	            // 텍스트도 숨기기
       	            info.el.style.color = 'transparent';
       	            // 이벤트 내용 숨기기
       	            var eventContent = info.el.querySelector('.fc-event-title, .fc-event-time');
       	            if (eventContent) {
       	                eventContent.style.display = 'none';
       	            }
       	        }
       	      }
       	    },
       	 eventContent: function(arg) { //주간 일정표 칸 커스텀 
       		 
       	  var event = arg.event;
       	  var view = arg.view.type; // 현재 뷰 타입 확인
       	  
       	  if (view === 'timeGridWeek') {
	       	  var achieveRate = event.extendedProps.achieveRate || 0;
	       	  var studyway = event.extendedProps.studyway || '';
	          var progress = event.extendedProps.progress || '';
	
	          var html =  '<div class="fc-event-content">' +
				          '<div class="fc-event-top">'+
				          '<div class="fc-event-studyway">' + studyway + '</div>' +
				          '<div class="fc-event-achieveRate">' + achieveRate + '%</div>' + '</div>' +
				          '<div class="progress-bar" style="--progress: ' + achieveRate + '%;"></div>' +
				          '<div class="fc-event-progress">' + progress + '</div>' +
				          '</div>';
	          
	          return { html: html };
          
       	 } else if (view === 'dayGridMonth') {
       	     // 월간 뷰일 때의 렌더링
       	     var avgAchieveRate = event.extendedProps.avgAchieveRate || 0; // 서버에서 계산된 일평균 달성율
       	     var textColor = avgAchieveRate == 100 ? '#D32F2F' : 'black'; // 100%일 때 빨간색, 그 외에는 검정색
       	     var fontWeight = avgAchieveRate == 100 ? 'bold' : 'normal';
       	     var heartIcon = avgAchieveRate == 100 ? '<img src="/img/schedule/redheart.png" alt="100% 달성" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 4px; margin-bottom: 2px;"> ' : '';
			 
       	     //toFixed(1) 소수 첫번째까지 표시하기
			 if (avgAchieveRate > 0) {
				 return {
			        html: '<div class="fc-event-content" style="display: flex; flex-direction: column; height: 100%; justify-content: flex-end; padding-bottom: 0 !important;">' +
			              '<div class="progress-bar" style="--progress: ' + avgAchieveRate + '%; height: 5px; margin-bottom: 4px;"></div>' +
			              '<div style="display: flex; justify-content: flex-end; align-items: center;">' +
			              '<div style="color: ' + textColor + '; font-weight: ' + fontWeight + ';">' + heartIcon + avgAchieveRate.toFixed(1) + '%</div>' +
			              '</div>' +
			              '</div>'
			      };
			  } else {
				  return {
			            html: '<div class="fc-event-content no-achievement"></div>'
			        };
			 }
       	   }
       	  
       	},eventClassNames: function(arg) {
       		
       	  var avgAchieveRate = arg.event.extendedProps.avgAchieveRate || 0;
       	  return avgAchieveRate > 0 ? '' : 'no-achievement-event';
       	    
       	},datesSet: function(info) { //월간뷰 데이터 세팅 
       	  var view = info.view;
       	  var start = view.currentStart;

       	  if (view.type === 'dayGridMonth') {
       		  
       		calendar.setOption('editable', false);
       	    // 월간 뷰에 대한 이벤트 데이터 로딩
       	    $.ajax({
       	      url: "/api/schedule/getMonthlyAchievement",
       	      type: "GET",
       	      dataType: "json",
       	      data: {
       	        year: start.getFullYear(),
       	        month: start.getMonth() + 1,
       	      },
       	      success: function(data) {
       	        // DTO 데이터 처리
       	        monthlyEvents = data.map(function(dto) {
       	          return {
       	        	title: dto.avgAchieveRate > 0 ? dto.avgAchieveRate.toFixed(1) + "%" : "",
       	            start: dto.date,
       	            extendedProps: {
       	            	avgAchieveRate: dto.avgAchieveRate
       	            },
       	        	id:dto.DailyAchieveId
       	          };
       	        });

       	        // 월간 이벤트만 표시
                calendar.removeAllEvents();
                calendar.addEventSource(monthlyEvents);
       	      },
       	      error: function(xhr, status, error) {
       	        console.error(error);
       	      }
       	    });
       	  }else if (view.type === 'timeGridWeek') {
       		  
       		calendar.setOption('editable', true);
       		$.ajax({
       	        url: "/api/schedule/findAll",
       	        type: "GET",
       	        dataType: "json",
       	        success: function(data) {
       	          weeklyEvents = data;
       	          calendar.removeAllEvents();
       	          calendar.addEventSource(weeklyEvents);
       	        },
       	        error: function(xhr, status, error) {
       	          console.error(error);
       	        }
       	      });
           }
       	 }
        });
 
      calendar.render();
      
  $(document).on('click', function(event) {
    var modal = $('#monthlyScheduleModal');
    if (modal.is(':visible') && !$(event.target).closest('.modal-content').length && !$(event.target).hasClass('fc-event-title')) {
        modal.modal('hide');
    }
});

  $(document).ready(function() {
    $.ajax({
        url: '/api/schedule/options',
        method: 'GET',
        success: function(data) {
            scheduleOptions = data;
            initializeDropdowns();
        },
        error: function(error) {
            console.error('Failed to load schedule options:', error);
        }
    });
});

  $("#calendarModal").on("hidden.bs.modal", function() {
  // 모든 입력 필드 리셋
  $("#calendarModal input, #calendarModal select").val("");
  
  // 동적으로 추가된 행 제거
  $("#progressEntries").empty();
  $("#progressEntries").html(`
    <div class="form-row align-items-center mb-2">
      <div class="col-4">
        <select class="form-control" id="material0" name="material[]"></select>
      </div>
      <div class="col-7">
        <input type="text" class="form-control" id="progress0" name="progress[]" placeholder="진도 내역">
      </div>
      <div class="col-auto">
        <button type="button" class="btn btn-success btn-sm add-progress">+</button>
      </div>
    </div>
  `);
  
  // 드롭다운 초기화
  initializeDropdowns();
  
  // progressCount 초기화
  progressCount = 1;
  
  // 추가 버튼 표시
  document.querySelector('.add-progress').style.display = 'inline-block';
});

  $("#updateModal").on("hidden.bs.modal", function() {
    // 수정 모달 창이 닫힌 후 실행되는 코드
    // 입력 필드 값 리셋
    $("#startTime").val("");
    $("#endTime").val("");
    $("#studyway").val("");
    $("#subject").val("");
    $("#material").val("");
    $("#progress").val("");
    $("#achieveRate").val("");
  });
});

document.addEventListener('DOMContentLoaded', function() {
  let progressCount = 1;

  document.querySelector('.add-progress').addEventListener('click', function() {
    if (progressCount < 5) {
      const newRow = document.createElement('div');
      newRow.className = 'form-row align-items-center mb-2 progress-entry';
      newRow.innerHTML = `
        <div class="col-4">
          <select class="form-control" id="material${progressCount}" name="material[]"></select>
        </div>
        <div class="col-7">
          <input type="text" class="form-control" id="progress${progressCount}" name="progress[]" placeholder="진도 내역">
        </div>
        <div class="col-auto">
          <button type="button" class="btn btn-danger btn-sm remove-progress">-</button>
        </div>
      `;
      document.getElementById('progressEntries').appendChild(newRow);
      fillNewMaterialDropdown(`material${progressCount}`);
      progressCount++;

      if (progressCount === 5) {
        document.querySelector('.add-progress').style.display = 'none';
      }
    }else {
        alert("진도 내역은 최대 5개까지 입력할 수 있습니다."); // 알림 메시지 표시
    }
  });

  document.getElementById('progressEntries').addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-progress')) {
      e.target.closest('.form-row').remove();
      progressCount--;
      document.querySelector('.add-progress').style.display = 'inline-block';
    }
  });
});

function fillNewMaterialDropdown(newDropdownId) {
		    fillDropdown(`#${newDropdownId}`, scheduleOptions.materials, "학습종류");
		}
		
function initializeDropdowns() {
		    fillDropdown('#studyway', scheduleOptions.studyways);
		    fillDropdown('#subject', scheduleOptions.subjects);
		    fillDropdown('#material', scheduleOptions.materials, "학습종류");
		    
		}
		
function fillDropdown(selector, options, defaultText = "선택하세요") {
    const dropdown = $(selector);
    dropdown.empty();
    dropdown.append(`<option value="">${defaultText}</option>`);
    $.each(options, function(i, option) {
        dropdown.append($('<option></option>').attr('value', option.id).text(option.name));
    });
}
