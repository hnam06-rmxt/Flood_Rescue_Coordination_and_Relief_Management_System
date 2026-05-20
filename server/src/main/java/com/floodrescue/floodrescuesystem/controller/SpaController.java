package com.floodrescue.floodrescuesystem.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping(value = {
            "/{path:^(?!api|ws|swagger-ui|v3|api-docs|error).*$}",
            "/**/{path:^(?!api|ws|swagger-ui|v3|api-docs|error).*$}"
    })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
