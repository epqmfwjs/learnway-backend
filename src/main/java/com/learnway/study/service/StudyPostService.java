package com.learnway.study.service;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learnway.member.domain.MemberRepository;
import com.learnway.study.domain.Study;
import com.learnway.study.domain.StudyProblem;
import com.learnway.study.domain.StudyProblemImgRepository;
import com.learnway.study.domain.StudyProblemRepository;
import com.learnway.study.domain.StudyRepository;
import com.learnway.study.dto.StudyDto;

@Service
public class StudyPostService {
	
	@Autowired
	private StudyRepository studyRepository;
	@Autowired
	private MemberRepository memberRepository;
	@Autowired
	private StudyProblemRepository studyProblemRepository;
	@Autowired
	private StudyProblemImgRepository studyProblemImgRepository;
	
	//모든게시글 출력
	public List<Study> findAll() {
        return studyRepository.findAll(Sort.by(Sort.Direction.DESC,"postid"));
    }

	//게시글 전체검색 메서드
	public Page<Study> getBoardList(Pageable pageable) {
        Sort sort = Sort.by(Sort.Direction.DESC, "postid");
        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        Page<Study> studies = studyRepository.findAll(sortedPageable);

        return studies;
    }
	//게시글 상세검색 메서드
	public Page<Study> boardSearchList(StudyDto dto, Pageable pageable) {
        // title과 detail 배열을 가져옴
        String title = dto.getTitle();
        int[] detail = dto.getDetailSearchArray();

        // title과 detail이 둘 다 null이 아닐 때
        if (title != null && detail != null) {
            List<Study> list = studyRepository.findByTitle(title);

            // Study 리스트에서 postid 값만 추출
            List<Integer> postIds = list.stream()
                                        .map(Study::getPostid)
                                        .collect(Collectors.toList());

            // detail 배열과 postIds 리스트의 중복값 찾기
            List<Integer> duplicates = IntStream.of(detail)
                                                .boxed()
                                                .filter(postIds::contains)
                                                .collect(Collectors.toList());

            // 중복값 출력 (디버깅 또는 로깅용)
            System.out.println("중복된 값: " + duplicates);

            // 중복된 postid를 가진 Study 엔티티 페이징 처리하여 반환
            if (duplicates.isEmpty()) {
                return Page.empty(pageable);
            } else {
                Sort sort = Sort.by(Sort.Direction.DESC, "postid");
                Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
                return studyRepository.findByPostidIn(duplicates, sortedPageable);
            }
        }

        // title만 있을 때
        if (title != null) {
        	System.out.println("제목값만 들어옴");
            Sort sort = Sort.by(Sort.Direction.DESC, "postid");
            Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
            return studyRepository.findByTitleContaining(title, sortedPageable);
        }

        // detail 배열만 있을 때
        if (detail != null) {
            Sort sort = Sort.by(Sort.Direction.DESC, "postid");
            Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
            return studyRepository.findByPostidIn(detail, sortedPageable);
        }

        // 둘 다 null일 때는 빈 페이지 반환
        return Page.empty(pageable);
    }
	
	//게시글 작성(게시글,지도,스터디채팅방,태그,문제 트랜젝션처리)
	//현재메서드는 게시글작성 및  return 값으로는 작성중인 potsId값 반환
	public Study boardadd(StudyDto dto,Principal principal) {
		
		Study study = Study.builder().title(dto.getTitle())
									       .content(dto.getContent())
									       .viewcount("0")
									       .startdate(dto.getStartdate())
									       .enddate(dto.getEnddate())
									       .isjoin((byte) dto.getIsjoin()).
									       member(memberRepository.findByMemberId(principal.getName()).get()).build();
		
	    
		return studyRepository.save(study);
		
		
	}
	
	// 게시글 수정 메서드
	public Study boardUpdate(StudyDto dto,Principal principal) {
		
		Study study = Study.builder().postid(dto.getPostid()).title(dto.getTitle())
				.content(dto.getContent())
				.viewcount(dto.getViewcount())
				.startdate(dto.getStartdate())
				.enddate(dto.getEnddate())
				.isjoin((byte) dto.getIsjoin()).member(memberRepository.findByMemberId(principal.getName()).get()).build();
		
		
		return studyRepository.save(study);
		
		
	}
	
	//게시글 제목검색 메서드
	public List<Study> searchBoardList(StudyDto dto) {
		return studyRepository.findByTitle(dto.getTitle());
	}
	
	//게시글 삭제 메서드
//	public void boardDelete(StudyDto dto,Principal principal) {
//	System.out.println(dto.getPostid() + "게시글id");
//	Study study = Study.builder().postid(dto.getPostid()).member(memberRepository.findByMemberId(principal.getName()).get())
//			.build();
//	studyRepository.delete(study);
//}
	
	@Transactional
	public void boardDelete(StudyDto dto, Principal principal) {
	    // 게시글 ID를 사용하여 Study 엔티티 조회
		Study study = Study.builder().postid(dto.getPostid()).
				member(memberRepository.findByMemberId(principal.getName()).get())
				.build();
	    if (study != null) {
	        // 연결된 problems 데이터 수동 삭제
	        List<StudyProblem> problems = study.getProblems();
	        if (problems != null) {
	        	
	        }
	            for (StudyProblem problem : problems) {
	            	System.out.println(problem.getProblemid() + " 문제아이디");
	            	
	                studyProblemRepository.delete(problem);
	            }
	        }
	        // Study 엔티티 삭제
	        studyRepository.delete(study);
	    
	}

}
