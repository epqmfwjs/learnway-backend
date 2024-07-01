package com.learnway.exam.service;

import com.learnway.exam.domain.Score;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface ScoreService {

    public Page<Score> getScoreListByExam(Long examId, Long memId, Pageable pageable);
    public Optional<Score> getScoreById(Long scoreId, Long memId);
    public void writeScore(Score score);
    public Optional<Score> updateScore(Score score);
    public void deleteScore(Long memId, Long scoreId);
    public List<Score> getScoreListBySubjectCode(Long memId, String subjectCode);
    public List<Score> getGrades(Long memId);
    public List<Score> getScoreListByExamType(Long memId, String examType);
    public List<Integer> getAvgScores(Long memId);
}
