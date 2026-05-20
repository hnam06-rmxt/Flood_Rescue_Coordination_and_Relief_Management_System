package com.floodrescue.floodrescuesystem.dto.response;

import java.util.List;

public class UploadResponse {
    private List<String> urls;
    private String joinedUrls;

    public UploadResponse() {
    }

    public UploadResponse(List<String> urls) {
        this.urls = urls;
        this.joinedUrls = String.join("|||", urls);
    }

    public List<String> getUrls() {
        return urls;
    }

    public void setUrls(List<String> urls) {
        this.urls = urls;
        this.joinedUrls = urls == null ? null : String.join("|||", urls);
    }

    public String getJoinedUrls() {
        return joinedUrls;
    }

    public void setJoinedUrls(String joinedUrls) {
        this.joinedUrls = joinedUrls;
    }
}
